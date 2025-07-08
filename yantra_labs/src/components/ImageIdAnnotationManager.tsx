import {
    annotation,
    Annotation,
    AnnotationState,
    GroupSpecificAnnotations,
    Annotations,
} from '@cornerstonejs/tools';

interface IAnnotationManager {
    getGroupKey: (annotationGroupSelector: any) => string;
    getAnnotations: (groupKey: string, toolName?: string) => Annotations | GroupSpecificAnnotations | undefined;
    addAnnotation: (annotation: Annotation, groupKey?: string) => void;
    removeAnnotation: (annotationUID: string) => void;
    removeAnnotations: (groupKey: string, toolName?: string) => void;
    saveAnnotations: (groupKey?: string, toolName?: string) => AnnotationState | GroupSpecificAnnotations | Annotations;
    restoreAnnotations: (state: AnnotationState | GroupSpecificAnnotations | Annotations, groupKey?: string, toolName?: string) => void;
    getNumberOfAllAnnotations: () => number;
    removeAllAnnotations: () => void;
}

const annotationMap: Record<string, Record<string, Annotation[]>> = {};

const ImageIdAnnotationManager: IAnnotationManager = {
    getGroupKey: (element: HTMLElement) => {
        const enabledElement = cornerstone.getEnabledElement(element);
        return enabledElement.image?.imageId || 'unknown';
    },

    getAnnotations: (groupKey, toolName) => {
        if (!annotationMap[groupKey]) return;
        return toolName ? { [toolName]: annotationMap[groupKey][toolName] || [] } : annotationMap[groupKey];
    },

    addAnnotation: (ann, groupKey = 'unknown') => {
        if (!annotationMap[groupKey]) annotationMap[groupKey] = {};
        const toolName = ann.metadata.toolName;
        if (!annotationMap[groupKey][toolName]) annotationMap[groupKey][toolName] = [];
        annotationMap[groupKey][toolName].push(ann);
    },

    removeAnnotation: (annotationUID) => {
        for (const group in annotationMap) {
            for (const tool in annotationMap[group]) {
                annotationMap[group][tool] = annotationMap[group][tool].filter(ann => ann.annotationUID !== annotationUID);
            }
        }
    },

    removeAnnotations: (groupKey, toolName) => {
        if (annotationMap[groupKey]) {
            if (toolName) delete annotationMap[groupKey][toolName];
            else delete annotationMap[groupKey];
        }
    },

    saveAnnotations: () => JSON.parse(JSON.stringify(annotationMap)),

    restoreAnnotations: (state) => {
        Object.assign(annotationMap, state);
    },

    getNumberOfAllAnnotations: () => {
        return Object.values(annotationMap).reduce((sum, group) =>
            sum + Object.values(group).reduce((acc, anns) => acc + anns.length, 0), 0);
    },

    removeAllAnnotations: () => {
        for (const group in annotationMap) delete annotationMap[group];
    },
};

export default ImageIdAnnotationManager;
