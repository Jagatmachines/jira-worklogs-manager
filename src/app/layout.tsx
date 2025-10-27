import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/app/globals.css';
import AppProviders from '@/app/providers';
import { type ReactNode } from 'react';
import { Toaster } from '@/app/_components/Toaster';
import { Header } from '@/app/_components/Header';
import { MaintenanceBreak } from './worklogs/_components/MaintenanceBreak';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
	title: 'Jira Worklogs Manager',
	description: 'Manage your Jira work logs in one simple dashboard'
};

const AppLayout = ({
	children
}: Readonly<{
	children: ReactNode;
}>) => {
	return (
		<html
			lang="en"
			// Warning: Extra attributes from the server: class,style
			//     at html
			//     at AppLayout (Server)
			// see providers.tsx => ThemeProvider
			// https://github.com/pacocoursey/next-themes
			suppressHydrationWarning>
			<body className={inter.className}>
				<AppProviders>
					<Header />
					<MaintenanceBreak />
					<main className="container mx-auto p-2">{children}</main>
					<Toaster />
				</AppProviders>
			</body>
		</html>
	);
};
export default AppLayout;
