import { MouseEvent, TouchEvent, useCallback, useMemo } from 'react';
import { isIOS } from 'react-device-detect';
import {
    LongPressDetectEvents,
    LongPressEvent,
    LongPressOptions,
    useLongPress,
} from 'use-long-press';

export type ContextMenuEvent<Target = HTMLElement> = LongPressEvent<Target>;

interface ContextMenuHookProps<Target = HTMLElement> {
    callback: (event?: ContextMenuEvent<Target>) => void;
    options?: LongPressOptions<Target>;
}

export interface ContextMenuHookResponse<Target = HTMLElement> {
    onTouchStart?: (event: TouchEvent<Target>) => void;
    onTouchMove?: (event: TouchEvent<Target>) => void;
    onTouchEnd?: (event: TouchEvent<Target>) => void;
    onContextMenu?: (event: MouseEvent<Target>) => void;
}

const useContextMenu = <Target = HTMLElement>({
    callback,
    options,
}: ContextMenuHookProps<Target>): ContextMenuHookResponse<Target> => {
    const handleContextMenu = useCallback(
        (event: MouseEvent<Target>) => {
            callback(event);
        },
        [callback]
    );

    const bind = useLongPress<Target>(callback, {
        ...options,
        captureEvent: true,
        detect: LongPressDetectEvents.TOUCH,
    });

    const response: ContextMenuHookResponse<Target> = useMemo(() => {
        let res: ContextMenuHookResponse<Target> = {};
        if (isIOS) {
            res = {
                ...bind,
            };
        }

        res.onContextMenu = handleContextMenu;
        return res;
    }, [bind, handleContextMenu]);

    return response;
};

export default useContextMenu;
