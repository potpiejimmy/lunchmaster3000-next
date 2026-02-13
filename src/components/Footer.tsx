"use client";

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';

export default function Footer() {

    const { t } = useTranslation();

    return (
        <Card>
            <CardContent>
                <Box className="flex flex-col sm:flex-row gap-4 items-start pt-1">
                    <Link href="/about">{t('components.footer.impressum')}</Link>
                    <Link href="/terms">{t('components.footer.terms')}</Link>
                    <Link href="/privacy">{t('components.footer.cookies')}</Link>
                    <Box className="grow"/>
                    {t('components.footer.allrights')}
                </Box>
            </CardContent>
        </Card>
    );
}
