import { createGenerateClassName, StylesProvider } from '@material-ui/styles';
import React from 'react';
import { ProviderProps } from './types';

type Props = ProviderProps;

const generateClassName = createGenerateClassName({
    productionPrefix: 'rat',
    seed: 'rat',
});

const StyleProvider: React.VFC<Props> = ({ children }) => {
    return <StylesProvider generateClassName={generateClassName}>{children}</StylesProvider>;
};

export default StyleProvider;
