import { EditorSelection } from '@codemirror/state';
import { EditorView } from '@codemirror/view';
import { useCallback } from 'react';

import type { EditorViewRef } from './editor.type';
import { useArchiveStore } from './model';
import type { PostImagesApiResponse } from '../image/image.dto';

import api from '@/shared/api/baseApi';

export const useMarkdown = ({
  editorViewRef,
  markdownText,
  setMarkdownText,
}: {
  editorViewRef: EditorViewRef;
  markdownText: string;
  setMarkdownText: (text: string) => void;
}) => {
  const getEditorContent = useCallback(() => {
    return editorViewRef.current?.state.doc.toString() || '';
  }, [editorViewRef]);

  const syncPreview = useCallback(() => {
    const content = getEditorContent();
    if (content === markdownText) return;

    setMarkdownText(content);
  }, [getEditorContent, setMarkdownText, markdownText]);

  const insertStartToggle = useCallback(
    (symbol: string, wrap: boolean = false) => {
      const editorView = editorViewRef.current;
      if (!editorView) return;

      editorView.focus();

      const { from, to } = editorView.state.selection.main;
      const selectedText = editorView.state.sliceDoc(from, to);

      if (wrap) {
        const hasExist = selectedText.startsWith(symbol) && selectedText.endsWith(symbol);

        editorView.dispatch({
          changes: {
            from,
            to,
            insert: hasExist
              ? selectedText.slice(symbol.length, selectedText.length - symbol.length)
              : `${symbol}${selectedText}${symbol}`,
          },
          selection: EditorSelection.range(
            from + (hasExist ? -symbol.length : symbol.length),
            to + (hasExist ? -symbol.length : symbol.length),
          ),
        });
      } else if (symbol === '```') {
        editorView.dispatch({
          changes: {
            from,
            to,
            insert: `\`\`\`\n${selectedText}\n\`\`\``,
          },
          selection: EditorSelection.cursor(to + 4),
        });
      } else {
        editorView.dispatch({
          changes: { from, to, insert: `${symbol}${selectedText}` },
          selection: EditorSelection.cursor(to + symbol.length),
        });
      }
    },
    [editorViewRef],
  );

  const insertImageAtCursor = useCallback((view: EditorView, imageUrl: string) => {
    const { state } = view;
    const { from } = state.selection.main;

    const transaction = state.update({
      changes: { from, to: from, insert: imageUrl },
      selection: { anchor: from + imageUrl.length },
    });

    view.dispatch(transaction);
  }, []);

  const handleImage = useCallback(
    async (imageFile: File, view: EditorView) => {
      if (!/image\/(png|jpg|jpeg|gif)/.test(imageFile.type)) return;

      const formData = new FormData();
      formData.append('files', imageFile);
      const { archiveData, updateArchiveData } = useArchiveStore.getState();

      try {
        const imageUrls = await api
          .post<PostImagesApiResponse>('/upload/images', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          })
          .then(res => {
            updateArchiveData('imageUrls', [
              ...archiveData.imageUrls,
              { url: res.data.data?.imgUrls[0].imgUrl ?? '' },
            ]);

            return res.data.data?.imgUrls;
          });

        insertImageAtCursor(view, `![Image](${imageUrls?.[0].imgUrl})`);
      } catch {
        console.error('Failed to upload image');
        return;
      }
    },
    [insertImageAtCursor],
  );

  const eventHandler = EditorView.domEventHandlers({
    paste(event, view) {
      if (!event.clipboardData) return;

      const { items } = event.clipboardData;

      for (const item of items) {
        if (item.kind === 'file') {
          const file = item.getAsFile();
          if (file) {
            void handleImage(file, view);
          }
        }
      }
    },
    drop(event, view) {
      if (!event.dataTransfer) return;

      const cursorPos = view.posAtCoords({ x: event.clientX, y: event.clientY });

      if (cursorPos) view.dispatch({ selection: { anchor: cursorPos, head: cursorPos } });

      const { files } = event.dataTransfer;

      for (const file of files) void handleImage(file, view);
    },
  });

  return {
    syncPreview,
    insertStartToggle,
    insertImageAtCursor,
    eventHandler,
    handleImage,
  };
};
