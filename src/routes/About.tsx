"use client";

import React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import MailIcon from '@mui/icons-material/MailOutline';
import { useTranslation } from 'react-i18next';

function About() {

    const { t } = useTranslation();

    return (
        <Card>
            <CardContent>
                <Typography gutterBottom variant="h5">
                    lunch.community
                </Typography>
                <Box>
                    <Typography sx={{ color: 'text.secondary' }}>
                        {t('routes.about.company_name')}<br/>
                        {t('routes.about.company_street')}<br/>
                        {t('routes.about.company_country')}
                    </Typography>
                </Box>
                <Box className="my-3">
                    <Typography sx={{ color: 'text.secondary' }}>
                        <MailIcon/><br/>
                        {t('routes.about.mail_contact')} info [at] lunch.community
                    </Typography>
                </Box>
            </CardContent>
        </Card>
    );
}

export default About;
