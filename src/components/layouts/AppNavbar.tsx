import { Link, useLocation } from "@tanstack/react-router";
import { Box } from "lucide-react";
import { SearchBar } from "#/components/SearchBar";
import { auth } from '#/lib/auth';
import { useEffect, useState } from 'react';

export default function AppNavbar() {
    const location = useLocation();
    const isSearchPage = location.pathname.startsWith('/search');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<any>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    
    useEffect(() => {
        setIsAuthenticated(auth.isAuthenticated());
        setUser(auth.getCurrentUser());
    }, [location.pathname]); // re-check on navigation

    return (
        <nav className="h-16 sticky top-0 z-50 bg-white border-b shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-between h-16 gap-4 relative">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2.5 group shrink-0">
                        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center group-hover:bg-indigo-700 transition-colors">
                            <Box className="w-4.5 h-4.5 text-white" />
                        </div>
                        <span className="text-xl font-bold text-gray-900 tracking-tight">
                        Thing<span className="text-indigo-600">Daddy</span>
                        </span>
                    </Link>
                    
                    {isSearchPage && (
                        <div className="flex-1 flex justify-center px-2 sm:px-4">
                            <div className="w-full max-w-2xl">
                                <SearchBar variant="page" />
                            </div>
                        </div>
                    )}
                    
                    <div className="flex items-center gap-4 shrink-0">
                        {isAuthenticated ? (
                            <div className="relative">
                                <button 
                                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg hover:ring-2 hover:ring-indigo-600 hover:ring-offset-2 transition-all focus:outline-none shadow-sm"
                                    title="Open user menu"
                                >
                                    {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                                </button>
                                
                                {isDropdownOpen && (
                                    <>
                                        <div 
                                          className="fixed inset-0 z-40" 
                                          onClick={() => setIsDropdownOpen(false)} 
                                        />
                                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50 origin-top-right transition-all">
                                            <div className="py-3 px-4 border-b border-gray-50 bg-gray-50/50">
                                                <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
                                                <p className="text-xs text-gray-500 truncate mt-0.5">{user?.email}</p>
                                            </div>
                                            <div className="py-1">
                                                <Link to="/dashboard" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                                                    Dashboard
                                                </Link>
                                                <Link to="/create" onClick={() => setIsDropdownOpen(false)} className="block px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors">
                                                    Register Thing
                                                </Link>
                                                <hr className="my-1 border-gray-100" />
                                                <button 
                                                    onClick={() => {
                                                        auth.logout().then(() => {
                                                            setIsAuthenticated(false);
                                                            setIsDropdownOpen(false);
                                                            window.location.href = '/';
                                                        });
                                                    }} 
                                                    className="block w-full text-left px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    Sign out
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link to="/login" className="text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors hidden sm:block">
                                    Sign in
                                </Link>
                                <Link to="/register" className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm whitespace-nowrap">
                                    Sign up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
