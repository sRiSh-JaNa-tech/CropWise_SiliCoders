import React from 'react';

interface AutoTranslateProps {
  text: string;
}

export const AutoTranslate: React.FC<AutoTranslateProps> = ({ text }) => {
  // Let the Google Translate DOM engine handle translation natively.
  // This wrapper now just passes the text through instantly.
  return <>{text}</>;
};
