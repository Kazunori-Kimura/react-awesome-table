import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import Table, { TableProps } from '../../src/components/Table';
import { ColumnDefinition } from '../../src/components/types';

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

// 列定義
const columns: ColumnDefinition<Point2D>[] = [
    {
        name: 'name',
        getValue: (item) => item.name,
    },
    {
        name: 'x',
        getValue: (item) => `${item.x}`,
    },
    {
        name: 'y',
        getValue: (item) => `${item.y}`,
    },
];

// キーの生成
const getRowKey = (item: Point2D): string => {
    return item.name;
};

const Template: Story<TableProps<Point2D>> = (args) => <Table {...args} />;

export const Sample = Template.bind({});
Sample.args = {
    data,
    columns,
    getRowKey,
};
