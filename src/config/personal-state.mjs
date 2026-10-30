// One application contract over Engine domain stores; admitted keys remain stable.
export const personalStateNamespace = 'consumer-blog-signature';
export const personalStateVersion = 1;
export const personalStorageKeys = Object.freeze({
 theme:'gaga:theme:v2', reader:'gaga:reader:v2', sfx:'gaga:sfx:v1',
 continuity:'gaga:continuity:v1', saved:'gaga:saved:v1',
 leftRail:'gaga:left-rail:v3', rightRail:'gaga:right-rail:v3',
 language:'gaga:language:v1', returnContext:'gaga:return-context:v1',
 identity:'gaga:identity:v1', designLanguage:'gaga:design-language:v1',
 annotations:'gaga:reading-knowledge:v1', annotationArchive:'gaga:personal-legacy:v1'
});
export const legacyAnnotationKeys = Object.freeze(['gaga:annotations:v1','gaga:highlights:v1']);
