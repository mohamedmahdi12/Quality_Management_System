"use client";

import { Loader2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const { t } = useTranslation();
  const [loadingText, setLoadingText] = useState('Loading...');

  useEffect(() => {
    setLoadingText(t('Loading...'));
  }, [t]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg font-medium">{loadingText}</p>
      </div>
    </div>
  );
}