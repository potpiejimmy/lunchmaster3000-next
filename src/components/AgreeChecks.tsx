"use client";

import React from "react";
import { Box, Checkbox, FormControlLabel } from "@mui/material";
import AppContext from "../AppContext";
import { useTranslation } from "react-i18next";
import Link from "next/link";

export default function AgreeChecks() {
    
    const context = React.useContext(AppContext);
    const { t } = useTranslation();

    return (
        <Box className="flex flex-col">
            <FormControlLabel control={
                    <Checkbox
                        checked={context?.agreeTerms}
                        onChange={e=>context?.setAgreeTerms(e.target.checked)}
                        />
                }
                label={
                    <Box className="flex flew-row items-center gap-1">
                        {t('general.terms_agree_1')}
                        <Link href="/terms">{t('general.terms_agree_2')}</Link>
                        {t('general.terms_agree_3')}
                    </Box>
                }/>
            <FormControlLabel control={
                    <Checkbox 
                        checked={context?.agreePrivacy}
                        onChange={e=>context?.setAgreePrivacy(e.target.checked)}
                    />
                }
                label={
                    <Box className="flex flew-row items-center gap-1">
                        {t('general.privacy_read_1')}
                        <Link href="/privacy">{t('general.privacy_read_2')}</Link>
                        {t('general.privacy_read_3')}
                    </Box>
                }/>
        </Box>
    );
}