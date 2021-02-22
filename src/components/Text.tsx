import React from 'react';

export interface TextProps {
    value: string;
}

const Text: React.FC<TextProps> = ({ value }) => {
    return <p>{value}</p>;
};

export default Text;
