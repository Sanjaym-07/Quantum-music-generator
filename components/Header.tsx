
import React from 'react';

export const Header: React.FC = () => {
    return (
        <header className="w-full max-w-7xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-quantum-light to-quantum-accent tracking-tighter">
                Quantum Music Generator
            </h1>
            <p className="mt-2 text-lg text-gray-300 font-light">
                Crafting melodies from the fabric of reality.
            </p>
        </header>
    );
};
