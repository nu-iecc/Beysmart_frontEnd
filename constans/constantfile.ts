import React from 'react';
import * as Icons from '../design-system/icons';

export const sceneCardData = [
    {
        id: 1,
        title: "first-card",
        icons: [React.createElement(Icons.FilledIcons.LightIcon, { width: 14, height: 14 }), React.createElement(Icons.FilledIcons.AlertIcon, { width: 14, height: 14 }), React.createElement(Icons.FilledIcons.HomeIcon, { width: 14, height: 14 })],
        colors: ['#A78BFA', '#7DD3FC'],
        titleColor: 'white',
        buttonText: 'Activate',
        buttonTextColor: '#7DD3FC',
        iconColor: '#A78BFA',
        cardStyle: { width: 280, minWidth: 280 }
    }
]
export const buttonData = [
    {
        id: 1,
        section: "Primary Buttons",
        buttons: [
            { variant: "primaryLarge", title: "Start", onPress: () => {} },
            { variant: "primaryMedium", title: "Start", onPress: () => {} },
            { variant: "primarySmall", title: "Start", onPress: () => {} },
            { variant: "primaryPressed", title: "Start", onPress: () => {} },
            { variant: "primaryDisabled", title: "Start", disabled: true, onPress: () => {} }
        ]
    },
    {
        id: 2,
        section: "Secondary Buttons",
        buttons: [
            { variant: "secondaryLarge", title: "Start", onPress: () => {} },
            { variant: "secondaryMedium", title: "Start", onPress: () => {} },
            { variant: "secondarySmall", title: "Start", onPress: () => {} },
            { variant: "secondaryPressed", title: "Start", onPress: () => {} },
            { variant: "secondaryDisabled", title: "Start", disabled: true, onPress: () => {} }
        ]
    },
    {
        id: 3,
        section: "Text Only",
        buttons: [
            { variant: "textOnlyLarge", title: "Start", onPress: () => {} },
            { variant: "textOnlyMedium", title: "Start", onPress: () => {} },
            { variant: "textOnlySmall", title: "Start", onPress: () => {} },
            { variant: "textOnlyPressed", title: "Start", onPress: () => {} },
            { variant: "textOnlyDisabled", title: "Start", disabled: true, onPress: () => {} }
        ]
    },
    {
        id: 4,
        section: "Icon Only",
        buttons: [
            { variant: "iconOnlyLarge", icon: React.createElement(Icons.FilledIcons.AlertIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.AlertIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlySmall", icon: React.createElement(Icons.FilledIcons.AlertIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyPressed", icon: React.createElement(Icons.FilledIcons.AlertIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyDisabled", icon: React.createElement(Icons.FilledIcons.AlertIcon, { width: 20, height: 20 }), disabled: true, onPress: () => {} }
        ]
    },
    {
        id: 5,
        section: "Icon Only - Different Icons",
        buttons: [
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.LightIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.HomeIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.SettingsIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.StarIcon, { width: 20, height: 20 }), onPress: () => {} },
            { variant: "iconOnlyMedium", icon: React.createElement(Icons.FilledIcons.HeartIcon, { width: 20, height: 20 }), onPress: () => {} }
        ]
    }
]