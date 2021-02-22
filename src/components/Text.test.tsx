import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import React from 'react';
import Text from './Text';

test('render Text component', () => {
    render(<Text value="test" />);

    const text = screen.getByText(/test/i);
    expect(text).toBeInTheDocument();
});
