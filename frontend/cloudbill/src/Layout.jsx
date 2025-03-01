import React from 'react'
import Header from './components/Header/Header'
import { Outlet } from 'react-router-dom'

const Layout = () => {
    return (
        <div className="flex h-screen">
            <div>
                <Header />
            </div>
            <div className="w-full">
                <Outlet />
            </div>
        </div>
    )
}

export default Layout
