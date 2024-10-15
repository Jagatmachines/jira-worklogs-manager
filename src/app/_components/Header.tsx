'use client';
import { Navbar, NavbarBrand, NavbarContent, NavbarItem, Link } from '@nextui-org/react';
import { usePathname } from 'next/navigation';

export const Header = () => {
	const pathName = usePathname();
	return (
		<Navbar position="static">
			<NavbarBrand>
				<p className="font-bold text-inherit">JWM</p>
			</NavbarBrand>
			<NavbarContent
				className="gap-4"
				justify="center">
				<NavbarItem isActive={pathName === '/worklogs'}>
					<Link
						color="foreground"
						href="/worklogs">
						Worklogs
					</Link>
				</NavbarItem>
				<NavbarItem isActive={pathName === '/configuration'}>
					<Link
						color="foreground"
						href="/configuration">
						Configuration
					</Link>
				</NavbarItem>
				<NavbarItem isActive={pathName === '/feedback'}>
					<Link
						color="foreground"
						href="/feedback">
						Issue / Feedback
					</Link>
				</NavbarItem>
			</NavbarContent>
		</Navbar>
	);
};
