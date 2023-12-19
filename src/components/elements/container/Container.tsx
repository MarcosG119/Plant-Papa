import React, { ReactNode } from 'react';

import './Container.css';

interface ContainerProps {
    children: ReactNode;
    borderRadius?: string;
}

const Container: React.FC<ContainerProps> = ({ children,borderRadius }) => {
    return <div className="container" style={{borderRadius}}>{children}</div>;
};

export default Container;
