export type GagaAriaCurrent = boolean | 'page' | 'step' | 'location' | 'date' | 'time';
export type GagaActionBaseProps = {
    id?: string;
    href?: string;
    action?: string;
    label: string;
    tooltip?: string;
    active?: boolean;
    ariaCurrent?: GagaAriaCurrent;
    ariaControls?: string;
    ariaExpanded?: boolean;
    ariaPressed?: boolean;
    class?: string;
};
export type GagaOutlineItem = {
    href: string;
    text: string;
    children?: GagaOutlineItem[];
};
export type GagaArticleMetaItem = {
    key: string;
    label?: string;
    text: string;
    datetime?: string;
};
export type GagaPreferenceOption = {
    value: string;
    label: string;
    checked?: boolean;
};
export type GagaPreferenceGroup = {
    key: string;
    legend: string;
    name?: string;
    options: GagaPreferenceOption[];
};
export type GagaMediaSource = {
    src: string;
    type?: string;
    media?: string;
};
export type GagaMediaFallback = {
    text: string;
    href?: string;
};
export type GagaMediaCredit = {
    text: string;
    label?: string;
    href?: string;
};
export type GagaMediaTrack = {
    src: string;
    kind: 'subtitles' | 'captions' | 'descriptions' | 'chapters' | 'metadata';
    label?: string;
    srclang?: string;
    default?: boolean;
};
export type GagaMediaTranscript = {
    href: string;
    label: string;
};
export type GagaMediaPrivacy = 'first-party' | 'trusted-external' | 'untrusted-external';
//# sourceMappingURL=types.d.ts.map