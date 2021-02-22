import { Meta, Story } from '@storybook/react/types-6-0';
import React from 'react';
import Text, { TextProps } from '../../src/components/Text';

export default {
    title: 'components/Text',
    component: Text,
} as Meta;

const Template: Story<TextProps> = (args) => <Text {...args} />;

export const Sample = Template.bind({});
Sample.args = {
    value: 'My first storybook.',
};
