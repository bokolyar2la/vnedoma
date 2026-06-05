'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

const mobileMenuLinks = [
	{ label: 'Все активности', href: '/tula' },
	{ label: 'Игры и клубы', href: '/tula/igry-i-kluby' },
	{ label: 'Танцы', href: '/tula/tancy' },
	{ label: 'Спорт и прогулки', href: '/tula/sport-i-progulki' },
	{ label: 'Творчество', href: '/tula/tvorchestvo' },
	{ label: 'Кулинария', href: '/tula/kulinariya' },
	{ label: 'Практики и здоровье', href: '/tula/praktiki-i-zdorove' },
	{ label: 'Книги и общение', href: '/tula/knigi-i-obshchenie' },
	{ label: 'Волонтёрство', href: '/tula/volonterstvo' },
	{ label: 'Театр и сцена', href: '/tula/teatr-i-scena' },
	{ label: 'Выезды и приключения', href: '/tula/vyezdy-i-priklyucheniya' },
	{ label: 'Можно одному', href: '/tula/mozhno-odnomu' },
	{ label: 'Где познакомиться', href: '/tula/gde-poznakomitsya' },
	{ label: 'На выходные', href: '/tula/chem-zanyatsya-v-vyhodnye' }
]

export function Header() {
	const pathname = usePathname()
	const [isMenuOpen, setIsMenuOpen] = useState(false)

	useEffect(() => {
		setIsMenuOpen(false)
	}, [pathname])

	return (
		<header className='sticky top-0 z-20 border-b border-city-line/80 bg-white/90 backdrop-blur-xl'>
			<div className='relative mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6'>
				<Link href='/' className='group flex min-w-0 items-center gap-3'>
					<span className='flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-city-green text-lg font-extrabold text-white shadow-sm transition group-hover:bg-city-blue'>
						В
					</span>
					<span className='min-w-0'>
						<span className='block text-xl font-extrabold leading-5 tracking-tight text-city-ink'>
							Влюди
						</span>
						<span className='block text-xs font-medium text-city-muted'>
							Тула
						</span>
					</span>
				</Link>

				<nav className='hidden items-center gap-1 rounded-full bg-city-soft/80 p-1 text-sm font-semibold text-city-muted sm:gap-2 md:flex'>
					<Link
						href='/tula'
						className='rounded-full px-3 py-2 transition hover:bg-white hover:text-city-green hover:shadow-sm'
					>
						Все активности
					</Link>
					<Link
						href='/add'
						className='rounded-full bg-city-green px-4 py-2 text-white shadow-sm transition hover:bg-city-blue'
					>
						Добавить
					</Link>
				</nav>

				<details
					className='group md:hidden'
					open={isMenuOpen}
					onToggle={event => setIsMenuOpen(event.currentTarget.open)}
				>
					<summary className='flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-2xl bg-city-soft text-city-ink ring-1 ring-city-line transition hover:bg-white hover:text-city-green hover:shadow-sm [&::-webkit-details-marker]:hidden'>
						<span className='sr-only'>Открыть меню</span>
						<span className='flex w-5 flex-col gap-1.5'>
							<span className='h-0.5 rounded-full bg-current transition group-open:translate-y-2 group-open:rotate-45' />
							<span className='h-0.5 rounded-full bg-current transition group-open:opacity-0' />
							<span className='h-0.5 rounded-full bg-current transition group-open:-translate-y-2 group-open:-rotate-45' />
						</span>
					</summary>
					<div className='absolute inset-x-4 top-[calc(100%+0.5rem)] max-h-[calc(100vh-6rem)] overflow-y-auto rounded-[28px] border border-city-line bg-white p-3 shadow-soft'>
						<nav className='grid gap-1'>
							{mobileMenuLinks.map(link => (
								<Link
									key={link.href}
									href={link.href}
									onClick={() => setIsMenuOpen(false)}
									className='rounded-2xl px-4 py-3 text-base font-semibold text-city-ink transition hover:bg-city-soft hover:text-city-green'
								>
									{link.label}
								</Link>
							))}
						</nav>
						<Link
							href='/add'
							onClick={() => setIsMenuOpen(false)}
							className='mt-2 block rounded-2xl bg-city-green px-4 py-3 text-center text-base font-semibold text-white shadow-sm transition hover:bg-city-blue'
						>
							Добавить активность
						</Link>
					</div>
				</details>
			</div>
		</header>
	)
}
