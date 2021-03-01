import { Meta } from '@storybook/react/types-6-0';
import React from 'react';
import Table from '../../src/components/Table';
import { Cell, ColumnDefinition } from '../../src/components/types';

export default {
    title: 'components/Table',
    component: Table,
} as Meta;

// ランダムな数値を取得
const random = (): number => {
    return Math.floor(Math.random() * 1000) / 100;
};

// ====== 最も単純なサンプル ======

// 定義
interface Point2D {
    name: string;
    x: number;
    y: number;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isPoint2D = (item: any): item is Point2D => {
    return (
        typeof item === 'object' &&
        typeof item.name === 'string' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number'
    );
};

// 1000件生成
const data: Point2D[] = [...Array(999)].map((_, index) => {
    const name = `point_${index + 1}`;
    return {
        name,
        x: random(),
        y: random(),
    };
});

// 必須チェック
const requiredValidator = (value: string): [boolean, string?] => {
    if (value.length === 0) {
        return [false, '必須項目です'];
    }
    return [true];
};

// 数値チェック
const numericValidator = (value: string): [boolean, string?] => {
    const v = parseFloat(value);
    if (isNaN(v) || v.toString() !== value) {
        return [false, '数値で入力してください'];
    }
    return [true];
};

// 列定義
const columns: ColumnDefinition<Point2D>[] = [
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        validator: requiredValidator,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
        validator: numericValidator,
    },
    {
        name: 'y',
        getValue: (item) => `${item.y}`,
        validator: numericValidator,
    },
];

// キーの生成
const getRowKey = (item: Point2D | undefined, rowIndex: number): string => {
    if (item) {
        return item.name;
    }
    return `new_point_${rowIndex}`;
};

// 最も単純なサンプル
export const Sample: React.VFC<Record<string, never>> = () => (
    <Table<Point2D> data={data} columns={columns} getRowKey={getRowKey} validator={isPoint2D} />
);

// ====== 非表示/読み取り専用/コンボボックス列サンプル ======

const Colors = ['Red', 'Green', 'Blue'] as const;
type Color = typeof Colors[number];

interface Point3D {
    id: string;
    name: string;
    x: number;
    y: number;
    z: number;
    color: Color;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isPoint3D = (item: any): item is Point3D => {
    return (
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.name === 'string' &&
        typeof item.x === 'number' &&
        typeof item.y === 'number' &&
        typeof item.z === 'number' &&
        Colors.includes(item.color)
    );
};

// 1000件生成
const points: Point3D[] = [...Array(999)].map((_, index) => {
    const id = `p_${index}`;
    const name = `point_${index + 1}`;
    const color: Color = Colors[index % Colors.length];
    return {
        id,
        name,
        x: random(),
        y: random(),
        z: random(),
        color,
    };
});

// 列定義
const columns2: ColumnDefinition<Point3D>[] = [
    {
        name: 'id',
        getValue: (item) => item.id,
        defaultValue: (_: number, cells: Cell<Point3D>[][]) => `p_${cells.length + 1}`,
        hidden: true,
        required: true,
    },
    {
        name: 'name',
        getValue: (item) => item.name,
        defaultValue: (row: number) => `point_${row + 1}`,
        validator: requiredValidator,
        required: true,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
        validator: numericValidator,
        readOnly: true,
    },
    {
        name: 'y',
        getValue: (item) => `${item.y}`,
        validator: numericValidator,
    },
    {
        name: 'z',
        getValue: (item) => `${item.y}`,
        validator: numericValidator,
    },
    {
        name: 'color',
        getValue: (item) => `${item.color}`,
        dataList: Colors.map((c) => ({ name: c, value: c })),
    },
];

const getRowKey2 = (
    item: Point3D | undefined,
    rowIndex: number,
    cells?: Cell<Point3D>[][]
): string => {
    return item ? item.id : `p_${cells ? cells.length + 1 : 0}`;
};

// 列定義サンプル
export const ColumnDef: React.VFC<Record<string, never>> = () => (
    <Table<Point3D> data={points} columns={columns2} getRowKey={getRowKey2} validator={isPoint3D} />
);
