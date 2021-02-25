import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import Table from '../../src/components/Table';
import { ColumnDefinition, TableProps } from '../../src/components/types';

export default {
    title: 'components/Table',
    component: Table,
} as Meta;

// 定義
interface Point2D {
    name: string;
    x: number;
    y: number;
}

// ランダムな数値を取得
const random = (): number => {
    return Math.floor(Math.random() * 1000) / 100;
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
        defaultValue: (row: number) => `point_${row}`,
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

const Template: Story<TableProps<Point2D>> = (args) => <Table {...args} />;

export const Sample = Template.bind({});
Sample.args = {
    data,
    columns,
    getRowKey,
};
