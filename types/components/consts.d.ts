export declare enum MouseButton {
    Primary = 0,
    Center = 1,
    Second = 2
}
interface CellSizeDefinition {
    DefaultWidth: number;
    MinHeight: number;
}
export declare const CellSize: Readonly<CellSizeDefinition>;
interface PopoverSizeDefinition {
    MaxWidth: number;
    MaxHeight: number;
}
export declare const Popover: Readonly<PopoverSizeDefinition>;
export {};
