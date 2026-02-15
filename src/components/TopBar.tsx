"use client";

import './TopBar.css';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import React, { useEffect } from 'react';
import ShareIcon from '@mui/icons-material/Share';
import SettingsIcon from '@mui/icons-material/SettingsApplications';
import { TypeWriter } from '../util/TypeWriter';
import Donate from './Donate';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import AppContext from '../AppContext';
import { IconButton } from '@mui/material';
import { useRouter } from 'next/navigation';

export default function TopBar() {

    const context = React.useContext(AppContext);
    const router = useRouter();

    const { t } = useTranslation();

    const CAROUSEL_RENDER_SIZE = 45; // number of pictures to render in carousel - should be large enough for largest screens
    const CAROUSEL_NUM_PICTURES = 15; // number of distinct carousel pictures in assets/dishes/dishX.jpg

    const [title, setTitle] = React.useState('lunch.community');
    const [animationState, setAnimationState] = React.useState('idle');
    const [dishes, setDishes] = React.useState(Array.from(Array(CAROUSEL_RENDER_SIZE).keys()).map(i=>i%CAROUSEL_NUM_PICTURES));

    const dishPics = Array.from(Array(CAROUSEL_NUM_PICTURES).keys()).map(i => `/assets/dishes/dish${i + 1}.jpg`);

    function shiftCarousel() {
        setAnimationState('shifted');
    }

    function shiftAnimationDone() {
        if (animationState === 'shifted') {
            let i = dishes.shift();
            dishes.push(i!);
            setAnimationState('idle');
            setDishes(dishes);
        }
    }

    function communityLink(): string {
        return (process.env.NEXT_PUBLIC_SHARE_URL || window.location.origin) + '?id=' + context?.community?.webid;
    }

    function linkCopied() {
        navigator.clipboard.writeText(communityLink());
        context?.setSnackText(t('components.topbar.link_copied'));
    }

    useEffect(() => {
        // mount:
        let slogan = t("components.topbar.slogan");
        const tw = new TypeWriter([slogan,"lunch.community"], setTitle)
        tw.start();
        let carouselTimeout: NodeJS.Timeout | undefined;
        let carouselInterval: NodeJS.Timeout | undefined;
    
        carouselTimeout = setTimeout(() => {
            shiftCarousel();
            carouselInterval = setInterval(()=>shiftCarousel(), 10_000)
        }, 2_000);

        return () => {
            // unmount:
            tw?.stop();
            if (carouselTimeout) clearTimeout(carouselTimeout);
            if (carouselInterval) clearInterval(carouselInterval);
        }    
    }, [t]);

    return (
        <Box>
            <AppBar position="static">
                <Toolbar className="space-x-5">
                    <Link href="/"><Box className="topbar-logo"/></Link>
                    <Box className="font-semibold text-base leading-tight tracking-tight sm:text-xl whitespace-nowrap">
                        {title}
                    </Box>
                    <Box className="grow"/>
                    <Box className="flex flex-row">
                        <IconButton sx={{color: 'primary.light'}} title={t('general.settings')} onClick={() => context?.community ? router.push('/settings') : undefined}>
                            <SettingsIcon/>
                        </IconButton>
                    </Box>
                </Toolbar>
                <Box className="topbar-subbar flex flex-row gap-5 items-center px-4">
                    <Box className="grow text-center">
                        {context?.name ? context?.name + " @ " : ""}
                        {context?.community?.name}
                        {context?.community &&
                            <IconButton size='small'
                                        sx={{color: 'primary.light'}}
                                        title={t('components.topbar.copy_link', {communityLink: communityLink()})}
                                        onClick={linkCopied}>
                                <ShareIcon fontSize='small'></ShareIcon>
                            </IconButton>
                        }
                    </Box>
                    <Box className="max-sm:hidden"><Donate/></Box>
                </Box>
                {/* image carousel start */}
                <Box className="max-sm:hidden overflow-hidden bg-white">

                    <Box className={`dish-carousel-anim-${animationState}`}
                            onTransitionEnd={()=>shiftAnimationDone()}>

                        <Box className="flex flex-row gap-0.5 p-0.5">
                            {dishes.map((i,ix) => <img src={dishPics[i]} width="120px" key={ix} alt={'dish'+ix}/>)}
                        </Box>
                    </Box>

                </Box>
                {/* image carousel end */}
            </AppBar>
            <Box className="sm:hidden flex flex-row justify-end px-5 pt-3 pb-1"><Donate/></Box>
        </Box>
    );
}
