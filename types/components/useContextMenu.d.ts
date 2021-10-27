import { MouseEvent, TouchEvent } from 'react';
import { LongPressEvent, LongPressOptions } from 'use-long-press';
export declare type ContextMenuEvent<Target = HTMLElement> = LongPressEvent<Target>;
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
declare const useContextMenu: <Target = HTMLElement>({ callback, options, }: ContextMenuHookProps<Target>) => ContextMenuHookResponse<Target>;
export default useContextMenu;
