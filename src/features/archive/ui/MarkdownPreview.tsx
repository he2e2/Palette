import { useEffect, useState } from 'react';

import styles from './MarkdownPreview.module.scss';

import { marked } from '@/shared/lib/mark';

type MarkdownPreviewProps = {
  markdownText: string;
};

export const MarkdownPreview = ({ markdownText }: MarkdownPreviewProps) => {
  const [htmlContent, setHtmlContent] = useState('');

  useEffect(() => {
    const parsingText = async () => {
      const html = await marked.parse(markdownText);
      setHtmlContent(html);
    };
    void parsingText();
  }, [markdownText]);
  return (
    <div
      className={styles.mirror}
      dangerouslySetInnerHTML={{
        __html: htmlContent,
      }}
    />
  );
};
