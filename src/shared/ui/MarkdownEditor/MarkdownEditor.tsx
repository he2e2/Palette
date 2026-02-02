import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import CodeMirror from '@uiw/react-codemirror';
import { useRef, useEffect, useState, useMemo, useCallback } from 'react';

import styles from './MarkdownEditor.module.scss';

import { MarkdownPreview, Toolbar, useMarkdown } from '@/features';

export interface MarkdownEditorProps<T extends Record<string, unknown>> {
  data: T;
  updateKey: { [K in keyof T]: T[K] extends string ? K : never }[keyof T];
  onUpdate: <K extends keyof T>(key: K, value: T[K]) => void;
  preview?: boolean;
}

export const MarkdownEditor = <T extends Record<string, unknown>>({
  data,
  updateKey,
  onUpdate,
  preview = true,
}: MarkdownEditorProps<T>) => {
  const editorViewRef = useRef<EditorView | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
  const [isMobile, setIsMobile] = useState(false);

  const { syncPreview, insertStartToggle, eventHandler, handleImage } = useMarkdown({
    editorViewRef,
    markdownText: data[updateKey] as string,
    setMarkdownText: markdown => {
      onUpdate(updateKey, markdown as T[typeof updateKey]);
    },
  });

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 1000);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const markdownValue = data[updateKey] as string;

  useEffect(() => {
    if (editorViewRef.current && markdownValue) {
      syncPreview();
    }
  }, [syncPreview, markdownValue]);

  const handleInsertImage = useCallback(
    (file: File) => {
      if (editorViewRef.current) {
        void handleImage(file, editorViewRef.current);
      }
    },
    [handleImage],
  );

  const handleChange = useCallback(
    (newValue: string) => {
      if ((dataRef.current[updateKey] as string).length > 2500) return;
      onUpdate(updateKey, newValue as T[typeof updateKey]);
    },
    [updateKey, onUpdate],
  );

  const extensions = useMemo(
    () => [
      markdown(),
      EditorView.lineWrapping,
      EditorView.theme({
        '&': { backgroundColor: '#f9f9f9', fontSize: '1rem' },
        '.cm-content': { padding: '1rem' },
        '.cm-gutters': { display: 'none' },
        '&.cm-focused': { outline: 'none' },
        '.cm-activeLine': { backgroundColor: 'transparent' },
      }),
      eventHandler,
    ],
    [eventHandler],
  );

  const renderEditor = () => (
    <div className={styles.editor}>
      <Toolbar
        onCommand={insertStartToggle}
        onInsertImage={handleInsertImage}
      />
      <CodeMirror
        extensions={extensions}
        onChange={handleChange}
        onUpdate={update => {
          if (update.view) {
            editorViewRef.current = update.view;
          }
        }}
        value={data[updateKey] as string}
      />
    </div>
  );

  const renderPreview = () =>
    preview && <MarkdownPreview markdownText={data[updateKey] as string} />;

  return (
    <div className={styles.container}>
      {isMobile ? (
        <>
          <div className={styles.tabs}>
            <button
              className={activeTab === 'editor' ? styles.activeTab : ''}
              onClick={() => {
                setActiveTab('editor');
              }}
            >
              Editor
            </button>
            <button
              className={activeTab === 'preview' ? styles.activeTab : ''}
              onClick={() => {
                setActiveTab('preview');
              }}
            >
              Preview
            </button>
          </div>
          {activeTab === 'editor' && renderEditor()}
          {activeTab === 'preview' && renderPreview()}
        </>
      ) : (
        <div className={styles.desktopLayout}>
          {renderEditor()}
          {renderPreview()}
        </div>
      )}
    </div>
  );
};
