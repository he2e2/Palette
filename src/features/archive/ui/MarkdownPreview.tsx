import { debounce } from 'lodash-es';
import { useEffect, useRef, useState } from 'react';

import styles from './MarkdownPreview.module.scss';

import { marked } from '@/shared/lib/mark';

type MarkdownPreviewProps = {
  markdownText: string;
};

export const MarkdownPreview = ({ markdownText }: MarkdownPreviewProps) => {
  const [htmlContent, setHtmlContent] = useState('');

  const debouncedParse = useRef(
    debounce(async (text: string) => {
      const html = await marked.parse(text);
      setHtmlContent(html);
    }, 300),
  ).current;

  useEffect(() => {
    void debouncedParse(markdownText);
    return () => {
      debouncedParse.cancel();
    };
  }, [markdownText, debouncedParse]);

  return (
    <div
      className={styles.mirror}
      dangerouslySetInnerHTML={{
        __html: htmlContent,
      }}
    />
  );
};
