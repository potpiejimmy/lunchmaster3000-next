"use client";

import React from "react";
import { Box, Button, Card, CardContent, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { largerInputSx } from "../util/Utils";
import { useRouter } from "next/navigation";

export default function Join() {

    const { t } = useTranslation();
    const router = useRouter();

    const [linkInput, setLinkInput] = React.useState('');

    async function join() {
        let urlParams = new URLSearchParams(linkInput.substring(linkInput.indexOf("?")));
        let communityId = urlParams && urlParams.get('id');
        if(communityId)
            router.push('/?id=' + communityId);
        // else
        //     this.snackBar.open(await this.translate.get("routes.join.error").toPromise(), null, {duration: 3000});
    }

    return (
        <Box className="flex flex-col gap-4">
            <Card>
                <CardContent>
                    <Typography gutterBottom variant="h5">
                        {t('routes.join.title')}
                    </Typography>
                    <Typography sx={{ color: 'text.secondary' }}>
                        {t('routes.join.subtitle')}
                    </Typography>
                    <Box className="flex flex-col gap-5" >
                        <TextField autoFocus
                                        label={t('routes.join.community_link')}
                                        sx={largerInputSx}
                                        value={linkInput}
                                        onChange={e=>setLinkInput(e.target.value)}
                                        variant="standard"/>
                        <Box className="flex flex-row">
                            <Button variant="contained"
                                    disabled={linkInput.trim().length===0}
                                    onClick={join}>
                                {t('routes.join.join_community_button')}
                            </Button>
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    )
}