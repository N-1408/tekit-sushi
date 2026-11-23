import React, { useEffect, useRef, useState, startTransition } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { lockPageScroll } from '../lib/scrolllock'
import { useStore, pName, pImg, isSpicy, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { pDesc } from '../lib/store'
import { haptic, useNativeBack, tgUser, currentTheme, subscribeTheme, changeTheme, type ThemeMode, TGA } from '../lib/tg'
import { beginAddToCartAnim, flyProductToCart } from '../lib/addAnim'
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler'
import MapPicker from './MapPicker'
import { DeliveryModal, PickupModal, InitialChoiceModal } from './Fulfillment'
import { BrandLogo } from './topbar/brand-logo'
import { TAB_PATHS } from './topbar'

const CDN = 'https://cdn.delever.uz/delever/'

/* ---------- ikonkalar (Phosphor — yagona uslub) ---------- */
export const IcBag = ({ s = 26 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.89481 1.33334C3.0908 1.33334 4.12244 2.16546 4.36518 3.32594L4.61076 4.50001H13.1524C14.147 4.50001 14.8713 5.43423 14.6151 6.3865L13.8281 9.31083C13.5336 10.4052 12.5334 11.1667 11.3904 11.1667H6.32462C5.12202 11.1667 4.08659 10.3255 3.85074 9.15697C3.48088 7.32445 3.10103 5.49411 2.71827 3.66421C2.63736 3.27738 2.29348 3.00001 1.89481 3.00001H1.50795C1.0435 3.00001 0.666992 2.62691 0.666992 2.16668C0.666992 1.70644 1.0435 1.33334 1.50795 1.33334H1.89481ZM5.5 8.83011L4.96244 6.16668H12.9335L12.203 8.88139C12.1048 9.24619 11.7714 9.50001 11.3904 9.50001H6.32462C5.92375 9.50001 5.57861 9.21963 5.5 8.83011Z" />
    <path d="M7.30046 13.3333C7.30046 14.0697 6.69804 14.6667 5.95492 14.6667C5.21181 14.6667 4.60939 14.0697 4.60939 13.3333C4.60939 12.597 5.21181 12 5.95492 12C6.69804 12 7.30046 12.597 7.30046 13.3333Z" />
    <path d="M11.3371 14.6667C12.0802 14.6667 12.6826 14.0697 12.6826 13.3333C12.6826 12.597 12.0802 12 11.3371 12C10.5939 12 9.99152 12.597 9.99152 13.3333C9.99152 14.0697 10.5939 14.6667 11.3371 14.6667Z" />
  </svg>
)

export const IcUser = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.3332 4.66668C11.3332 6.50763 9.84079 8.00001 7.99984 8.00001C6.15889 8.00001 4.6665 6.50763 4.6665 4.66668C4.6665 2.82573 6.15889 1.33334 7.99984 1.33334C9.84079 1.33334 11.3332 2.82573 11.3332 4.66668ZM9.6665 4.66668C9.6665 5.58715 8.92031 6.33334 7.99984 6.33334C7.07936 6.33334 6.33317 5.58715 6.33317 4.66668C6.33317 3.7462 7.07936 3.00001 7.99984 3.00001C8.92031 3.00001 9.6665 3.7462 9.6665 4.66668Z" />
    <path d="M7.45544 8.66784L7.45462 8.66784C6.81334 8.6657 6.2 8.66365 5.64744 8.68961C4.93885 8.72291 4.25011 8.80409 3.63933 9.02407C3.00646 9.25202 2.45474 9.63012 2.04717 10.2364C1.6511 10.8256 1.43327 11.5678 1.34209 12.4574L1.34201 12.4582C1.28497 13.0202 1.54253 13.5118 1.78238 13.8204C1.9115 13.9866 2.06423 14.1382 2.22958 14.2593C2.38249 14.3714 2.60468 14.5005 2.87159 14.542C2.88105 14.5435 2.89068 14.5448 2.90018 14.546L2.93052 14.5495C2.94949 14.5517 2.97714 14.5549 3.01295 14.5589C3.08458 14.5669 3.18893 14.5782 3.32209 14.5917C3.58833 14.6187 3.97013 14.6545 4.43606 14.6902C5.36664 14.7616 6.63897 14.8334 7.99983 14.8334C10.6839 14.8334 11.0609 14.833 13.116 14.5438L13.1281 14.542C13.395 14.5004 13.6172 14.3714 13.7701 14.2593C13.9354 14.1382 14.0882 13.9866 14.2173 13.8205C14.4571 13.5119 14.7148 13.0203 14.6577 12.4582L14.6577 12.4574C14.5665 11.5678 14.3486 10.8256 13.9526 10.2364C13.545 9.63012 12.9933 9.25202 12.3604 9.02407C11.7496 8.80409 11.0609 8.72291 10.3523 8.68961C9.79975 8.66365 9.1864 8.6657 8.54513 8.66784L8.5443 8.66784C8.36477 8.66844 8.18306 8.66905 7.99987 8.66905C7.81669 8.66905 7.63497 8.66844 7.45544 8.66784ZM4.5636 13.0284C4.11286 12.9938 3.74466 12.9593 3.49007 12.9335C3.26386 12.9106 3.05342 12.8885 3.0013 12.6155C3.07661 11.8931 3.2402 11.4491 3.43035 11.1662C3.61003 10.8989 3.85066 10.7194 4.2041 10.5921C4.57963 10.4569 5.07117 10.3852 5.72567 10.3544C6.23226 10.3306 6.78851 10.3324 7.42111 10.3345C7.60714 10.3351 7.79996 10.3357 7.99987 10.3357C8.19979 10.3357 8.39242 10.3351 8.57845 10.3345C9.21104 10.3324 9.76748 10.3306 10.2741 10.3544C10.9286 10.3852 11.4201 10.4569 11.7956 10.5921C12.1491 10.7194 12.3897 10.8989 12.5694 11.1662C12.7595 11.4491 12.9231 11.8931 12.9984 12.6155C12.9335 12.9551 12.5256 12.9784 12.2033 12.9968C12.1292 13.0011 12.0597 13.0051 11.9998 13.0126C10.7693 13.1667 10.1914 13.1667 8.01077 13.1667H7.99983C6.69402 13.1667 5.46636 13.0977 4.5636 13.0284Z" />
  </svg>
)

export const IcPin = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.00033 5.5C7.26395 5.5 6.66699 6.09695 6.66699 6.83333C6.66699 7.56971 7.26395 8.16667 8.00033 8.16667C8.7367 8.16667 9.33366 7.56971 9.33366 6.83333C9.33366 6.09695 8.7367 5.5 8.00033 5.5Z" />
    <path d="M8.02023 1.00004C4.77048 0.98859 2.17779 3.70184 2.167 6.99623L2.16699 7.01657C2.16699 7.02578 2.16714 7.03498 2.16745 7.04418C2.2186 8.58774 2.73226 10.0795 3.64111 11.3119C4.02212 11.8381 4.82485 12.6762 5.58774 13.3844C5.97674 13.7455 6.37528 14.0914 6.7279 14.3626C6.90371 14.4978 7.07815 14.6222 7.24111 14.7224C7.38805 14.8127 7.58668 14.9222 7.79821 14.9751C7.93091 15.0083 8.06974 15.0083 8.20244 14.9751C8.51588 14.8968 8.83458 14.7103 9.09013 14.5407C9.36708 14.3568 9.65997 14.1304 9.93781 13.8995C10.492 13.439 11.0355 12.9191 11.3459 12.585L11.3504 12.5801C12.6475 11.161 13.7943 9.25428 13.8335 7.1081L13.8336 7.09288V7.0353C13.8436 3.74177 11.2693 1.01148 8.02023 1.00004ZM3.83366 7.00232V7.00039C3.8423 4.57019 5.74169 2.65869 8.01436 2.66669C10.2876 2.6747 12.1749 4.60049 12.167 7.03145L12.167 7.03418V7.08494C12.1357 8.65675 11.2799 10.1861 10.1225 11.4531C9.8652 11.7297 9.376 12.1993 8.87255 12.6177C8.62086 12.8269 8.37799 13.0129 8.16822 13.1522C8.11578 13.187 8.06739 13.2176 8.02321 13.244C7.94347 13.1905 7.85 13.123 7.74392 13.0414C7.44598 12.8123 7.08837 12.5033 6.72163 12.1629C5.97478 11.4696 5.26966 10.7201 4.98958 10.3323L4.98443 10.3254C4.27984 9.37104 3.87635 8.20992 3.83366 7.00232Z" />
  </svg>
)

export const IcClock = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.16634 6.33337C9.16634 5.87314 8.79324 5.50004 8.33301 5.50004C7.87277 5.50004 7.49967 5.87314 7.49967 6.33337V7.9347L6.14494 9.01786C5.78547 9.30526 5.72705 9.82966 6.01446 10.1891C6.30186 10.5486 6.82626 10.607 7.18572 10.3196L8.8534 8.98624C9.05119 8.8281 9.16634 8.5886 9.16634 8.33536V6.33337Z" />
    <path d="M14.6663 8.00004C14.6663 11.6819 11.6816 14.6667 7.99967 14.6667C4.31778 14.6667 1.33301 11.6819 1.33301 8.00004C1.33301 4.31814 4.31778 1.33337 7.99967 1.33337C11.6816 1.33337 14.6663 4.31814 14.6663 8.00004ZM12.9997 8.00004C12.9997 10.7615 10.7611 13 7.99967 13C5.23825 13 2.99967 10.7615 2.99967 8.00004C2.99967 5.23862 5.23825 3.00004 7.99967 3.00004C10.7611 3.00004 12.9997 5.23862 12.9997 8.00004Z" />
  </svg>
)

export const IcSearch = ({ s = 17 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.6598 11.8387C9.686 12.568 8.47662 13 7.16634 13C3.94468 13 1.33301 10.3884 1.33301 7.16671C1.33301 3.94505 3.94468 1.33337 7.16634 1.33337C10.388 1.33337 12.9997 3.94505 12.9997 7.16671C12.9997 8.47699 12.5677 9.68636 11.8383 10.6602L14.4225 13.2443C14.7479 13.5698 14.7479 14.0974 14.4225 14.4228C14.097 14.7483 13.5694 14.7483 13.244 14.4228L10.6598 11.8387ZM11.333 7.16671C11.333 9.46789 9.46753 11.3334 7.16634 11.3334C4.86516 11.3334 2.99967 9.46789 2.99967 7.16671C2.99967 4.86552 4.86516 3.00004 7.16634 3.00004C9.46753 3.00004 11.333 4.86552 11.333 7.16671Z" />
  </svg>
)

export const IcMinus = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.84003 7.99333C1.84003 7.5331 2.21312 7.16 2.67336 7.16L13.34 7.16C13.8003 7.16 14.1734 7.5331 14.1734 7.99333C14.1734 8.45357 13.8003 8.82667 13.34 8.82667L2.67336 8.82667C2.21312 8.82667 1.84003 8.45357 1.84003 7.99333Z" />
  </svg>
)

export const IcPlus = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.99668 1.83C8.45692 1.83 8.83002 2.2031 8.83002 2.66333V7.16333H13.33C13.7903 7.16333 14.1633 7.53643 14.1633 7.99667C14.1633 8.4569 13.7903 8.83 13.33 8.83H8.83002V13.33C8.83002 13.7902 8.45692 14.1633 7.99668 14.1633C7.53645 14.1633 7.16335 13.7902 7.16335 13.33V8.83H2.66335C2.20311 8.83 1.83002 8.4569 1.83002 7.99667C1.83002 7.53643 2.20311 7.16333 2.66335 7.16333L7.16335 7.16333V2.66333C7.16335 2.2031 7.53645 1.83 7.99668 1.83Z" />
  </svg>
)

export const IcPlate = ({ s = 34 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 2C8.46024 2 8.83333 2.3731 8.83333 2.83333V3.69799C10.3287 3.81446 11.7875 4.27564 12.9226 5.41074C13.8045 6.29264 14.3527 7.47885 14.6237 8.66134C14.9787 10.2098 13.648 11.3333 12.3333 11.3333L3.66668 11.3333C2.35198 11.3333 1.02136 10.2098 1.37629 8.66134C1.64733 7.47885 2.19553 6.29264 3.07742 5.41074C4.21252 4.27565 5.67132 3.81446 7.16667 3.698V2.83333C7.16667 2.3731 7.53976 2 8 2ZM4.25593 6.58926C5.1609 5.68429 6.44352 5.33333 8.00001 5.33333C9.55651 5.33333 10.8391 5.68429 11.7441 6.58926C12.3493 7.19444 12.7783 8.07017 12.9992 9.0337C13.0349 9.18937 12.9938 9.32528 12.8848 9.4424C12.7667 9.56924 12.5689 9.66667 12.3333 9.66667L3.66668 9.66667C3.43117 9.66667 3.23335 9.56924 3.11527 9.4424C3.00624 9.32528 2.96515 9.18937 3.00083 9.0337C3.22168 8.07017 3.65075 7.19444 4.25593 6.58926Z" />
    <path d="M1.29883 13.1667C1.29883 12.7064 1.67192 12.3333 2.13216 12.3333H13.8675C14.3278 12.3333 14.7009 12.7064 14.7009 13.1667C14.7009 13.6269 14.3278 14 13.8675 14H2.13216C1.67192 14 1.29883 13.6269 1.29883 13.1667Z" />
  </svg>
)

export const IcStore = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.1663 6.66669C12.1663 6.20645 11.7932 5.83336 11.333 5.83336C10.8728 5.83336 10.4997 6.20645 10.4997 6.66669C10.4997 7.32973 10.2363 7.96562 9.76744 8.43446C9.2986 8.9033 8.66272 9.16669 7.99967 9.16669C7.33663 9.16669 6.70075 8.9033 6.23191 8.43446C5.76307 7.96562 5.49967 7.32973 5.49967 6.66669C5.49967 6.20645 5.12658 5.83336 4.66634 5.83336C4.2061 5.83336 3.83301 6.20645 3.83301 6.66669C3.83301 7.77176 4.27199 8.83157 5.0534 9.61297C5.8348 10.3944 6.89461 10.8334 7.99967 10.8334C9.10474 10.8334 10.1646 10.3944 10.946 9.61297C11.7274 8.83157 12.1663 7.77176 12.1663 6.66669Z" />
    <path d="M7.91635 2.80148L6.46317 1.53784C6.14961 1.26518 5.6831 1.26518 5.36954 1.53784L4.01199 2.71832L2.72691 1.55007C2.38636 1.24048 1.85932 1.26557 1.54973 1.60612C1.44502 1.7213 1.3786 1.85781 1.34972 2.00002H1.33301V12.6667C1.33301 13.8633 2.30306 14.8334 3.49967 14.8334H12.4997C13.6963 14.8334 14.6663 13.8633 14.6663 12.6667V2.00002H14.6496C14.6208 1.85781 14.5543 1.7213 14.4496 1.60612C14.14 1.26557 13.613 1.24048 13.2725 1.55007L12.3558 2.3834L11.9059 2.79239L10.4632 1.53784C10.1496 1.26518 9.6831 1.26518 9.36954 1.53784L7.91635 2.80148ZM4.55449 4.45524C4.49123 4.51181 4.42116 4.55714 4.34699 4.59109C4.23687 4.64163 4.11852 4.66663 4.00049 4.66669C3.87159 4.66685 3.74239 4.63728 3.62404 4.57745C3.55521 4.54274 3.49038 4.49798 3.43182 4.44333L2.99967 4.05047V12.6667C2.99967 12.9428 3.22353 13.1667 3.49967 13.1667H12.4997C12.7758 13.1667 12.9997 12.9428 12.9997 12.6667V4.05048L12.5602 4.44997C12.3783 4.61537 12.1431 4.68524 11.9163 4.66251C11.6957 4.68462 11.4667 4.61917 11.2862 4.46218L9.91635 3.27101L8.5465 4.46218C8.36595 4.61918 8.13701 4.68464 7.91635 4.6625C7.6957 4.68464 7.46675 4.61918 7.2862 4.46218L5.91635 3.27101L4.55449 4.45524Z" />
  </svg>
)

export const IcSort = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.86688 6.16666C7.51695 7.2313 6.51475 7.99999 5.33301 7.99999C4.15127 7.99999 3.14906 7.2313 2.79913 6.16666H2.16634C1.7061 6.16666 1.33301 5.79356 1.33301 5.33332C1.33301 4.87309 1.7061 4.49999 2.16634 4.49999H2.79913C3.14906 3.43535 4.15127 2.66666 5.33301 2.66666C6.51475 2.66666 7.51695 3.43535 7.86688 4.49999H13.833C14.2932 4.49999 14.6663 4.87309 14.6663 5.33332C14.6663 5.79356 14.2932 6.16666 13.833 6.16666H7.86688ZM6.33301 5.33332C6.33301 5.88561 5.88529 6.33332 5.33301 6.33332C4.78072 6.33332 4.33301 5.88561 4.33301 5.33332C4.33301 4.78104 4.78072 4.33332 5.33301 4.33332C5.88529 4.33332 6.33301 4.78104 6.33301 5.33332Z" />
    <path d="M13.2002 11.5C12.8503 12.5646 11.8481 13.3333 10.6663 13.3333C9.4846 13.3333 8.4824 12.5646 8.13247 11.5H2.16634C1.7061 11.5 1.33301 11.1269 1.33301 10.6667C1.33301 10.2064 1.7061 9.83332 2.16634 9.83332H8.13247C8.4824 8.76868 9.4846 7.99999 10.6663 7.99999C11.8481 7.99999 12.8503 8.76868 13.2002 9.83332H13.833C14.2932 9.83332 14.6663 10.2064 14.6663 10.6667C14.6663 11.1269 14.2932 11.5 13.833 11.5H13.2002ZM10.6663 11.6667C11.2186 11.6667 11.6663 11.2189 11.6663 10.6667C11.6663 10.1144 11.2186 9.66666 10.6663 9.66666C10.1141 9.66666 9.66634 10.1144 9.66634 10.6667C9.66634 11.2189 10.1141 11.6667 10.6663 11.6667Z" />
  </svg>
)

export const IcChevL = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M11.0889 12.9226C10.7635 13.248 10.2359 13.248 9.91042 12.9226L4.98783 8.00002L9.91042 3.07743C10.2359 2.75199 10.7635 2.75199 11.0889 3.07743C11.4144 3.40287 11.4144 3.93051 11.0889 4.25594L7.34485 8.00002L11.0889 11.7441C11.4144 12.0695 11.4144 12.5972 11.0889 12.9226Z" />
  </svg>
)

export const IcTruck = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M9.99967 2.00002C9.99967 2.7364 9.40272 3.33335 8.66634 3.33335C7.92996 3.33335 7.33301 2.7364 7.33301 2.00002C7.33301 1.26364 7.92996 0.666687 8.66634 0.666687C9.40272 0.666687 9.99967 1.26364 9.99967 2.00002Z" />
    <path d="M11.9997 14.6667C13.4724 14.6667 14.6663 13.4728 14.6663 12C14.6663 10.5273 13.4724 9.33335 11.9997 9.33335C10.5269 9.33335 9.33301 10.5273 9.33301 12C9.33301 13.4728 10.5269 14.6667 11.9997 14.6667ZM12.9997 12C12.9997 12.5523 12.552 13 11.9997 13C11.4474 13 10.9997 12.5523 10.9997 12C10.9997 11.4477 11.4474 11 11.9997 11C12.552 11 12.9997 11.4477 12.9997 12Z" />
    <path d="M6.66634 12C6.66634 13.4728 5.47243 14.6667 3.99967 14.6667C2.52691 14.6667 1.33301 13.4728 1.33301 12C1.33301 10.5273 2.52691 9.33335 3.99967 9.33335C5.47243 9.33335 6.66634 10.5273 6.66634 12ZM3.99967 13C4.55196 13 4.99967 12.5523 4.99967 12C4.99967 11.4477 4.55196 11 3.99967 11C3.44739 11 2.99967 11.4477 2.99967 12C2.99967 12.5523 3.44739 13 3.99967 13Z" />
    <path d="M5.29228 2.55308C5.08398 2.47497 4.85311 2.48338 4.65105 2.57645C4.44899 2.66951 4.29254 2.8395 4.21651 3.04857L2.88318 6.71523C2.72701 7.14471 2.94585 7.61984 3.37374 7.7803L5.95979 8.75006L7.57512 9.77335L7.18103 11.8442C7.09499 12.2964 7.39176 12.7326 7.84389 12.8187C8.29601 12.9047 8.73228 12.6079 8.81832 12.1558L9.31832 9.52836C9.38224 9.19245 9.23448 8.85159 8.94563 8.6686L7.34526 7.6548L7.94562 6.00382L8.75404 7.00337C8.8522 7.12474 8.98247 7.21609 9.13003 7.26703L11.0611 7.9337C11.4961 8.08389 11.9705 7.85298 12.1207 7.41794C12.2709 6.9829 12.04 6.50847 11.605 6.35828L9.8997 5.76956L8.31428 3.80931C8.2208 3.69374 8.09812 3.60527 7.95894 3.55308L5.29228 2.55308ZM6.60123 4.82394L5.83749 6.9242L4.73145 6.50944L5.49519 4.40917L6.60123 4.82394Z" />
  </svg>
)

export const IcStar = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.80504 1.74298C8.50723 0.974568 7.41998 0.974572 7.12217 1.74298L5.72179 5.35615L1.85271 5.57146C1.02988 5.61725 0.693912 6.65128 1.33267 7.17197L4.33626 9.62035L3.34543 13.3666C3.13471 14.1633 4.01432 14.8024 4.7069 14.3558L7.96361 12.2558L11.2203 14.3558C11.9129 14.8024 12.7925 14.1633 12.5818 13.3666L11.5909 9.62035L14.5945 7.17197C15.2333 6.65128 14.8973 5.61725 14.0745 5.57146L10.2054 5.35615L8.80504 1.74298Z" />
  </svg>
)

export const IcBin = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.66667 7.00004C7.1269 7.00004 7.5 7.37314 7.5 7.83337V10.5C7.5 10.9603 7.1269 11.3334 6.66667 11.3334C6.20643 11.3334 5.83333 10.9603 5.83333 10.5V7.83337C5.83333 7.37314 6.20643 7.00004 6.66667 7.00004Z" />
    <path d="M9.33333 7.00004C9.79357 7.00004 10.1667 7.37314 10.1667 7.83337V10.5C10.1667 10.9603 9.79357 11.3334 9.33333 11.3334C8.8731 11.3334 8.5 10.9603 8.5 10.5V7.83337C8.5 7.37314 8.8731 7.00004 9.33333 7.00004Z" />
    <path d="M6.16667 1.33337C5.7946 1.33337 5.46761 1.58002 5.3654 1.93777L4.87142 3.66671H2.83333C2.3731 3.66671 2 4.0398 2 4.50004C2 4.96028 2.3731 5.33337 2.83333 5.33337H3.1959L3.44313 12.2559C3.49117 13.6011 4.59555 14.6667 5.94154 14.6667H10.0585C11.4044 14.6667 12.5088 13.6011 12.5569 12.2559L12.8041 5.33337H13.1667C13.6269 5.33337 14 4.96028 14 4.50004C14 4.0398 13.6269 3.66671 13.1667 3.66671H11.1286L10.6346 1.93777C10.5324 1.58002 10.2054 1.33337 9.83333 1.33337H6.16667ZM9.39523 3.66671L9.20475 3.00004H6.79525L6.60478 3.66671H9.39523ZM11.1364 5.33337H4.86363L5.10874 12.1964C5.12475 12.6448 5.49288 13 5.94154 13H10.0585C10.5071 13 10.8752 12.6448 10.8913 12.1964L11.1364 5.33337Z" />
  </svg>
)

export const IcCheck = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.9226 4.40408C13.248 4.72952 13.248 5.25716 12.9226 5.58259L6.66665 11.8385L3.07739 8.24926C2.75195 7.92382 2.75195 7.39618 3.07739 7.07075C3.40283 6.74531 3.93047 6.74531 4.2559 7.07075L6.66665 9.48149L11.7441 4.40408C12.0695 4.07864 12.5971 4.07864 12.9226 4.40408Z" />
  </svg>
)

export const IcChevR = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style={{ transform: 'rotate(180deg)' }}>
    <path d="M11.0889 12.9226C10.7635 13.248 10.2359 13.248 9.91042 12.9226L4.98783 8.00002L9.91042 3.07743C10.2359 2.75199 10.7635 2.75199 11.0889 3.07743C11.4144 3.40287 11.4144 3.93051 11.0889 4.25594L7.34485 8.00002L11.0889 11.7441C11.4144 12.0695 11.4144 12.5972 11.0889 12.9226Z" />
  </svg>
)

export const IcArrowUp = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path transform="translate(-3 0)" d="M7.74407 4.24409C7.41864 4.56953 7.41864 5.09717 7.74407 5.4226C8.06951 5.74804 8.59715 5.74804 8.92259 5.4226L10.1667 4.17853L10.1667 13.8333C10.1667 14.2936 10.5398 14.6667 11 14.6667C11.4602 14.6667 11.8333 14.2936 11.8333 13.8333V4.17845L13.0775 5.4226C13.4029 5.74804 13.9306 5.74804 14.256 5.4226C14.5814 5.09717 14.5814 4.56953 14.256 4.24409L11.5893 1.57739C11.4937 1.4818 11.3807 1.41428 11.2604 1.37485C11.2047 1.35652 11.1463 1.34392 11.0861 1.33774C10.9573 1.32445 10.8259 1.34109 10.7034 1.38768C10.6005 1.4268 10.5038 1.48703 10.4199 1.56837L10.4092 1.57895L7.74407 4.24409Z" />
  </svg>
)
export const IcChevronsUp = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.2c.21 0 .41.08.56.23l3.68 3.68a.75.75 0 1 1-1.06 1.06L8 3.05 4.82 6.17a.75.75 0 0 1-1.06-1.06l3.68-3.68A.79.79 0 0 1 8 1.2Z" />
    <path d="M8 6.2c.21 0 .41.08.56.23l3.68 3.68a.75.75 0 1 1-1.06 1.06L8 8.05 4.82 11.17a.75.75 0 0 1-1.06-1.06l3.68-3.68A.79.79 0 0 1 8 6.2Z" />
  </svg>
)
export const IcTop = ({ s = 20 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
    <path d="M5 4h14" />
    <path d="M12 20V8.5" />
    <path d="M6.5 14 12 8.5l5.5 5.5" />
  </svg>
)
export const IcBurger = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.3" y="2.9" width="13.4" height="2.1" rx="1.05" />
    <rect x="1.3" y="6.95" width="13.4" height="2.1" rx="1.05" />
    <rect x="1.3" y="11" width="13.4" height="2.1" rx="1.05" />
  </svg>
)

/* Globus: til almashtirish (headerdagi chap tugma). IcBurger bilan bir xil uslub. */
export const IcGlobe = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M8 1.333C4.318 1.333 1.333 4.318 1.333 8s2.985 6.667 6.667 6.667 6.667-2.985 6.667-6.667S11.682 1.333 8 1.333Zm4.974 6H10.94a10.6 10.6 0 0 0-.584-2.827c.734.243 1.375.617 1.863 1.101a5.32 5.32 0 0 1 .755 1.726ZM8 2.667c.443 0 1.06.753 1.453 2.06.18.61.314 1.303.395 2.058H6.152c.081-.755.214-1.448.395-2.058C6.94 3.42 7.557 2.667 8 2.667ZM3.026 7.333a5.32 5.32 0 0 1 .755-1.726c.488-.484 1.13-.858 1.863-1.101A10.6 10.6 0 0 0 5.06 7.333H3.026Zm0 1.334H5.06c.057 1.024.252 1.98.584 2.827-.734-.243-1.375-.617-1.863-1.101a5.32 5.32 0 0 1-.755-1.726ZM8 13.333c-.443 0-1.06-.753-1.453-2.06a9.29 9.29 0 0 1-.395-2.058h3.696a9.29 9.29 0 0 1-.395 2.058c-.393 1.307-1.01 2.06-1.453 2.06Zm2.356-2.24c.332-.846.527-1.802.584-2.826h2.034a5.32 5.32 0 0 1-.755 1.726c-.488.484-1.13.858-1.863 1.1Z"/>
  </svg>
)

export const IcHome = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.49 1.45c.3-.24.72-.24 1.02 0l5.55 4.48c.38.31.61.78.61 1.27v5.9c0 .94-.76 1.7-1.7 1.7h-2.35v-3.02c0-1.06-.86-1.92-1.92-1.92s-1.92.86-1.92 1.92V14.8H3.83a1.7 1.7 0 0 1-1.7-1.7V7.2c0-.49.23-.96.61-1.27Z" />
  </svg>
)

export const IcTag = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="5.1" cy="5.1" r="1.95" />
    <circle cx="10.9" cy="10.9" r="1.95" />
    <path d="M12.3 2.4 3.4 12.9" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </svg>
)

export const IcCash = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M1.9 3.6h12.2c.61 0 1.1.49 1.1 1.1v6.6c0 .61-.49 1.1-1.1 1.1H1.9c-.61 0-1.1-.49-1.1-1.1V4.7c0-.61.49-1.1 1.1-1.1ZM8 6.2a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6Z" />
  </svg>
)
export const IcCard = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M3.2 3.4h9.6c.99 0 1.8.81 1.8 1.8v5.6c0 .99-.81 1.8-1.8 1.8H3.2c-.99 0-1.8-.81-1.8-1.8V5.2c0-.99.81-1.8 1.8-1.8ZM1.4 6.2h13.2v1.9H1.4Z" />
  </svg>
)

export const IcX = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3.9 3.9l8.2 8.2M12.1 3.9l-8.2 8.2" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
)

export const IcSun = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="2.7" />
    <path d="M8 .9v2.1M8 13v2.1M.9 8h2.1M13 8h2.1M3.05 3.05l1.5 1.5M11.45 11.45l1.5 1.5M12.95 3.05l-1.5 1.5M4.55 11.45l-1.5 1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </svg>
)

export const IcMoon = ({ s = 14 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M14.05 9.6A6.2 6.2 0 0 1 6.4 1.95a.75.75 0 0 0-.95-.95 7.2 7.2 0 1 0 9.55 9.55.75.75 0 0 0-.95-.95Z" />
  </svg>
)

export const IcScale = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="2.6" y="8.6" width="2.7" height="5.2" rx="1.35" />
    <rect x="6.65" y="5.4" width="2.7" height="8.4" rx="1.35" />
    <rect x="10.7" y="2.2" width="2.7" height="11.6" rx="1.35" />
  </svg>
)

export const IcSauce = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="6.55" y="1.1" width="2.9" height="1.5" rx="0.75" />
    <path d="M6.9 3.1h2.2v1.6c1.55.9 2.5 2.5 2.5 4.3v4.1c0 .94-.76 1.7-1.7 1.7H6.1a1.7 1.7 0 0 1-1.7-1.7V9c0-1.8.95-3.4 2.5-4.3Z" />
  </svg>
)

export const IcLocate = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <circle cx="8" cy="8" r="5.3" fill="none" stroke="currentColor" strokeWidth="1.7" />
    <circle cx="8" cy="8" r="1.8" />
    <path d="M8 .9v2.2M8 12.9v2.2M.9 8h2.2M12.9 8h2.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" fill="none" />
  </svg>
)

export const IcInfo = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M7.99967 7.49998C8.45991 7.49998 8.83301 7.87308 8.83301 8.33331V10.6666C8.83301 11.1269 8.45991 11.5 7.99967 11.5C7.53944 11.5 7.16634 11.1269 7.16634 10.6666V8.33331C7.16634 7.87308 7.53944 7.49998 7.99967 7.49998Z" />
    <path d="M7.99967 4.66665C7.53944 4.66665 7.16634 5.03974 7.16634 5.49998C7.16634 5.96022 7.53944 6.33331 7.99967 6.33331C8.45991 6.33331 8.83301 5.96022 8.83301 5.49998C8.83301 5.03974 8.45991 4.66665 7.99967 4.66665Z" />
    <path d="M1.33301 7.99998C1.33301 4.31808 4.31778 1.33331 7.99967 1.33331C11.6816 1.33331 14.6663 4.31808 14.6663 7.99998C14.6663 11.6819 11.6816 14.6666 7.99967 14.6666C4.31778 14.6666 1.33301 11.6819 1.33301 7.99998ZM7.99967 2.99998C5.23825 2.99998 2.99967 5.23856 2.99967 7.99998C2.99967 10.7614 5.23825 13 7.99967 13C10.7611 13 12.9997 10.7614 12.9997 7.99998C12.9997 5.23856 10.7611 2.99998 7.99967 2.99998Z" />
  </svg>
)

export const IcMail = ({ s = 16 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M1.63483 4.70349C1.62489 4.73335 1.6158 4.76355 1.60758 4.79407C1.33301 5.83744 1.33301 8.00108 1.33301 8.00108C1.33301 8.00108 1.33301 10.1757 1.60758 11.2081C1.60797 11.2095 1.60836 11.211 1.60876 11.2124L4.07712 8.74408C4.40256 8.41864 4.93019 8.41864 5.25563 8.74408C5.58107 9.06952 5.58107 9.59715 5.25563 9.92259L2.79238 12.3858C3.86218 12.6688 7.99965 12.6688 7.99965 12.6688C7.99965 12.6688 12.1709 12.6688 13.2157 12.3945L10.7438 9.92259C10.4183 9.59715 10.4183 9.06952 10.7438 8.74408C11.0692 8.41864 11.5969 8.41864 11.9223 8.74408L14.3929 11.2147C14.6663 10.1696 14.6663 8.01206 14.6663 8.01206C14.6663 8.01206 14.6773 5.83744 14.3917 4.79407C14.3835 4.76353 14.3744 4.73335 14.3645 4.70353L8.92917 8.99461C8.38421 9.42484 7.61521 9.42484 7.07024 8.99461L1.63483 4.70349ZM13.0876 3.58821C11.8686 3.33334 7.99965 3.33334 7.99965 3.33334C7.99965 3.33334 4.10985 3.33334 2.90195 3.58039L7.99971 7.60494L13.0876 3.58821Z" />
  </svg>
)

export const IcHeart = ({ s = 16, on = false }: { s?: number; on?: boolean }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill={on ? '#E23B52' : 'none'} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 14.1C4.9 11.6 1.6 9.06 1.6 5.9 1.6 3.6 3.4 1.7 5.7 1.7c.9 0 1.7.35 2.3.95.6-.6 1.4-.95 2.3-.95 2.3 0 4.1 1.9 4.1 4.2 0 3.16-3.3 5.7-6.4 8.2Z" stroke={on ? '#E23B52' : 'var(--mut)'} strokeWidth={on ? 0 : 1.7} />
  </svg>
)

export const IcLock = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M5.4 5.4V4.9a2.6 2.6 0 1 1 5.2 0v.5h.7c.94 0 1.7.76 1.7 1.7v5.2c0 .94-.76 1.7-1.7 1.7H4.7c-.94 0-1.7-.76-1.7-1.7V7.1c0-.94.76-1.7 1.7-1.7h.7Zm1.7-.5v.5h1.8v-.5a.9.9 0 1 0-1.8 0Z" />
  </svg>
)



/* ---------- savat tugmasi (badge bilan) ---------- */
export function CartBtn() {
  const { cartCount, cartSum } = useStore()
  const nav = useNavigate()
  return (
    <button onClick={() => { haptic(); nav('/cart') }} aria-label="cart"
      className="press relative flex items-center gap-2 h-10 pl-2 pr-1 rounded-xl shrink-0 active:scale-95 transition-transform">
      {cartSum > 0 && <span className="text-[13.5px] font-extrabold whitespace-nowrap">{fmt(cartSum)} <span className="text-[9.5px] font-bold text-[var(--mut2)]">UZS</span></span>}
      <IcBag />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#E8462B] text-white text-[10.5px] font-extrabold grid place-items-center leading-none">{cartCount}</span>
      )}
    </button>
  )
}

/* ---------- til tanlash (bayroqchali) ---------- */
const FlagUZ = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#F4F4F4" />
    <rect width="30" height="6.7" fill="#0099B5" /><rect y="13.3" width="30" height="6.7" fill="#1EB53A" />
    <rect y="6.4" width="30" height="0.6" fill="#CE1126" /><rect y="13" width="30" height="0.6" fill="#CE1126" />
    <circle cx="5" cy="3.3" r="2.1" fill="#fff" /><circle cx="5.9" cy="2.8" r="1.85" fill="#0099B5" />
    <circle cx="9.4" cy="1.7" r="0.55" fill="#fff" /><circle cx="10.6" cy="2.7" r="0.55" fill="#fff" /><circle cx="10.2" cy="4.3" r="0.55" fill="#fff" /><circle cx="8.8" cy="4.7" r="0.55" fill="#fff" /><circle cx="8.2" cy="3.2" r="0.55" fill="#fff" />
  </svg>
)
const FlagRU = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#fff" /><rect y="6.7" width="30" height="6.6" fill="#0039A6" /><rect y="13.3" width="30" height="6.7" fill="#D52B1E" />
  </svg>
)
const FlagEN = ({ s = 15 }: { s?: number }) => (
  <svg width={s} height={Math.round((s * 2) / 3)} viewBox="0 0 30 20" className="rounded-[2px] shrink-0">
    <rect width="30" height="20" fill="#012169" />
    <path d="M0,0 30,20M30,0 0,20" stroke="#fff" strokeWidth="4" />
    <path d="M0,0 30,20M30,0 0,20" stroke="#C8102E" strokeWidth="1.6" />
    <rect x="12.2" width="5.6" height="20" fill="#fff" /><rect y="7.2" width="30" height="5.6" fill="#fff" />
    <rect x="13.4" width="3.2" height="20" fill="#C8102E" /><rect y="8.4" width="30" height="3.2" fill="#C8102E" />
  </svg>
)
const FLAGS: Record<string, (p: { s?: number }) => React.ReactElement> = { uz: FlagUZ, ru: FlagRU, en: FlagEN }
const FlagOf = ({ l, s = 15 }: { l: string; s?: number }) => { const F = FLAGS[l] || FlagUZ; return <F s={s} /> }
const LANG_NAME: Record<string, string> = { uz: "O'zbekcha", ru: 'Русский', en: 'English' }

/* Til tanlash pastki oynasi: bayroq + nom, joriy tilda belgi.
   LangPicker (Profil) va mobil headerdagi til tugmasi birgalikda ishlatadi. */
export function LangSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang } = useStore()
  return (
    <Sheet open={open} onClose={onClose} title={t.language}>
      <div className="space-y-2 pb-2">
        {(['uz', 'ru', 'en'] as const).map(l => (
          <button key={l} onClick={() => { setLang(l); haptic(); onClose() }}
            className={`press w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${lang === l ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)] border-[var(--chip-on)] shadow-[0_4px_12px_-4px_rgba(0,0,0,.3)]' : 'bg-[var(--panel)] border-navy-line'}`}>
            <FlagOf l={l} s={22} />
            <span className="text-[15px] font-extrabold flex-1">{LANG_NAME[l]}</span>
            {lang === l && <IcCheck s={18} />}
          </button>
        ))}
      </div>
    </Sheet>
  )
}

export function LangPicker({ dark }: { dark?: boolean }) {
  const { lang } = useStore()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`press flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-extrabold active:scale-95 transition-transform ${dark ? 'bg-[var(--panel)] text-[var(--ink)]' : 'bg-navy-soft text-navy-ink'}`}>
        <FlagOf l={lang} s={15} />{lang.toUpperCase()}
      </button>
      <LangSheet open={open} onClose={() => setOpen(false)} />
    </>
  )
}


/* ---------- mavzu almashtirish tugmasi ---------- */

/* variant: 'default' — Profil va boshqa ekranlar uchun eskicha ko'rinish;
   'header' — mobil ko'k header uchun: oq ikonka, oq/16% doira. */
export function ThemeToggle({ variant = 'default', className }: { variant?: 'default' | 'header'; className?: string } = {}) {
  const { t } = useStore()
  const [theme, setThemeL] = useState<ThemeMode>(() => currentTheme())
  useEffect(() => subscribeTheme(setThemeL), [])
  const cls = className ?? (variant === 'header'
    ? 'focus-ring press grid place-items-center w-11 h-11 rounded-full bg-[var(--hdr-chip)] text-white hover:bg-[var(--hdr-chip-hover)] active:scale-95 transition-colors shrink-0'
    : 'focus-ring press grid place-items-center w-10 h-10 rounded-full bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)] active:scale-95 transition-colors shrink-0')
  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={changeTheme}
      aria-label={t.themeLabel}
      icon={(dark) => (dark ? <IcSun s={17} /> : <IcMoon s={17} />)}
      className={cls}
    />
  )
}

export { TopBar, WhaleMark } from './topbar'
export { BrandLogo } from './topbar/brand-logo'

/* ---------- headerdagi til tanlash (lg+): o'ng chetda dropdown ---------- */
function HeaderLang() {
  const { lang, setLang } = useStore()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} aria-haspopup="listbox" aria-expanded={open}
        className="press focus-ring flex items-center gap-1.5 h-11 px-3 rounded-full text-[12.5px] font-medium bg-[var(--hdr-chip)] text-white hover:bg-[var(--hdr-chip-hover)] transition-colors">
        <FlagOf l={lang} s={14} />{lang.toUpperCase()}
        <span className={`transition-transform duration-150 ${open ? 'rotate-90' : ''}`}><IcChevR s={12} /></span>
      </button>
      <div role="listbox" aria-label="language"
        className={`absolute right-0 top-[calc(100%+8px)] w-40 rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_16px_40px_-16px_rgba(0,0,0,.35)] p-1.5 origin-top-right motion-safe:transition-[opacity,scale] motion-safe:duration-150 motion-safe:ease-out ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {(['uz', 'ru', 'en'] as const).map(l => (
          <button key={l} onClick={() => { setLang(l); haptic('light'); setOpen(false) }} role="option" aria-selected={lang === l}
            className={`press w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-extrabold transition-colors ${lang === l ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'text-[var(--ink2)] hover:bg-[var(--soft)]'}`}>
            <FlagOf l={l} s={16} />{LANG_NAME[l]}
            {lang === l && <span className="ml-auto"><IcCheck s={14} /></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

/* ---------- bosh sahifa headeri: FAQAT logo + nom.
   Barcha ikonkalar (yetkazish/olib-ketish, til, tema, profil) Profile
   ekraniga ko'chirildi. ---------- */
/* Desktop: buyurtma turi tanlovi — mobil headerdagi kabi bosilganda
   "Yetkazib berish / Olib ketish" paneli ochiladi, variant tanlansa mos
   modal (manzil/filial) chiqadi. onPick — Header'ning chooseMode'i. */
function HeaderModePicker({ mode, t, onPick }: {
  mode: string; t: any; onPick: (m: 'delivery' | 'pickup') => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    window.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); window.removeEventListener('keydown', onKey) }
  }, [open])
  return (
    <div ref={ref} className="relative min-w-0">
      <button onClick={() => { haptic(); setOpen(v => !v) }} aria-haspopup="listbox" aria-expanded={open}
        className="press focus-ring flex items-center gap-1.5 h-11 pl-3.5 pr-3 rounded-full bg-[var(--hdr-chip)] text-[15px] font-medium uppercase tracking-wide text-white active:scale-[.97] transition-transform min-w-0">
        <span className="truncate">{mode === 'delivery' ? t.fcDel : mode === 'pickup' ? t.fcPick : t.orderType}</span>
        <span className={`transition-transform duration-150 shrink-0 ${open ? 'rotate-90' : ''}`}><IcChevR s={12} /></span>
      </button>
      <div role="listbox" aria-label="order-type"
        className={`absolute left-0 top-[calc(100%+8px)] z-30 w-56 rounded-2xl border border-[var(--line)] bg-[var(--panel)] shadow-[0_16px_40px_-16px_rgba(0,0,0,.35)] p-1.5 origin-top-left motion-safe:transition-[opacity,scale] motion-safe:duration-150 motion-safe:ease-out ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}`}>
        {ORDER_MODES.map(m => (
          <button key={m} role="option" aria-selected={mode === m}
            onClick={() => { setOpen(false); onPick(m) }}
            className={`press w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-[13px] font-extrabold transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'text-[var(--ink2)] hover:bg-[var(--soft)]'}`}>
            {m === 'delivery' ? <IcTruck s={16} /> : <IcStore s={16} />}
            {m === 'delivery' ? t.fcDel : t.fcPick}
            {mode === m && <span className="ml-auto"><IcCheck s={14} /></span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export function Header() {
  const { t, lang, setLang, user, ob, mode, setMode, ordersActiveCount } = useStore()
  const nav = useNavigate()
  const [delOpen, setDelOpen] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  const [langOpen, setLangOpen] = useState(false)
  const [selOpen, setSelOpen] = useState(false)
  const [selAnim, setSelAnim] = useState(false)
  const selAnimT = useRef<number | null>(null)
  // Panel ochilishi/yopilishi FAQAT transform/opacity (overlay) — sahifa qayta joylashmaydi.
  // will-change faqat animatsiya davomida: state + taymer bilan yoqiladi/o'chiriladi.
  const toggleSel = () => {
    haptic()
    setSelOpen(v => !v)
    setSelAnim(true)
    if (selAnimT.current) window.clearTimeout(selAnimT.current)
    selAnimT.current = window.setTimeout(() => setSelAnim(false), 280)
  }
  useEffect(() => () => { if (selAnimT.current) window.clearTimeout(selAnimT.current) }, [])
  /* Variant tanlash: panel DARHOL yopiladi, mos modal (manzil/filial) ochiladi;
     setMode (butun ilova qayta renderi) startTransition ichida — animatsiya kutmaydi.
     Tanlangan variantni yana bosish ham modalni ochadi (manzilni o'zgartirish uchun). */
  const chooseMode = (m: 'delivery' | 'pickup') => {
    haptic('medium')
    setSelOpen(false)
    if (m === 'delivery') setDelOpen(true); else setPickOpen(true)
    startTransition(() => setMode(m))
  }
  const [askState, setAskState] = useState(() => {
    try { return !localStorage.getItem('tk-onboarded') } catch { return true }
  })
  const isWide = useIsDesktop()
  const hdrRef = useRef<HTMLElement | null>(null)
  // Panel ochiq bo'lsa: tashqariga bosilsa yoki Escape bosilsa yopiladi
  useEffect(() => {
    if (!selOpen || isWide) return
    const onDown = (e: PointerEvent) => {
      if (hdrRef.current && !hdrRef.current.contains(e.target as Node)) setSelOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setSelOpen(false) }
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('pointerdown', onDown); document.removeEventListener('keydown', onKey) }
  }, [selOpen, isWide])
  // birinchi tashrif: bir marta so'raladi; yopilsa ham yoziladi
  const askOpen = askState && !!user && !ob


  return (
    <>
      {isWide ? (
        /* KENG ekran (lg+): mobil header bilan bir xil tartib — ko'k fon,
           chapda til + tema + buyurtma turi, MARKAZDA logo, o'ngda
           Savat/Buyurtmalar/Profil (ismisiz). */
        <header ref={hdrRef} className="relative z-[31] text-white">
          <div className="max-w-[1240px] mx-auto">
            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 lg:px-6 py-2.5">
              {/* chapda: til, tema, buyurtma turi */}
              <div className="justify-self-start flex items-center gap-2 min-w-0">
                <HeaderLang />
                <ThemeToggle variant="header" />
                <HeaderModePicker mode={mode} t={t} onPick={chooseMode} />
              </div>
              {/* markazda: logo */}
              <button onClick={() => nav('/')} aria-label="Tekit Sushi"
                className="press flex items-center gap-2 min-w-0 active:opacity-80 transition-opacity">
                <img src="/logo-light.png" alt="Tekit Sushi" width={36} height={36}
                  className="w-[36px] h-[36px] object-contain" />
                <span className="text-[17px] font-extrabold tracking-[0.08em] whitespace-nowrap">TEKIT SUSHI</span>
              </button>
              {/* o'ngda: Savat, Buyurtmalar, Profil */}
              <div className="justify-self-end flex items-center gap-1.5 shrink-0">
                <button onClick={() => { haptic(); setProfilePanelOpen(false); setOrdersPanelOpen(false); setCartPanelOpen(true) }}
                  className="press focus-ring flex items-center gap-2 h-11 px-4 rounded-full bg-[var(--hdr-chip)] text-[14.5px] font-medium uppercase tracking-wide text-white hover:bg-[var(--hdr-chip-hover)] active:scale-[.97] transition-all">
                  <IcBag s={16} />{t.tabCart}
                </button>
                <button onClick={() => { haptic(); setCartPanelOpen(false); setProfilePanelOpen(false); setOrdersPanelOpen(true) }}
                  className="press focus-ring flex items-center gap-2 h-11 px-4 rounded-full bg-[var(--hdr-chip)] text-[14.5px] font-medium uppercase tracking-wide text-white hover:bg-[var(--hdr-chip-hover)] active:scale-[.97] transition-all">
                  <IcNavOrders s={16} />{t.tabOrders}
                </button>
                <button onClick={() => { haptic(); setCartPanelOpen(false); setOrdersPanelOpen(false); setProfilePanelOpen(true) }}
                  className="press focus-ring flex items-center gap-2 h-11 px-4 rounded-full bg-[var(--hdr-chip)] text-[14.5px] font-medium uppercase tracking-wide text-white hover:bg-[var(--hdr-chip-hover)] active:scale-[.97] transition-all">
                  <IcUser s={16} />{t.tabProfile}
                </button>
              </div>
            </div>
          </div>
        </header>
      ) : (
        /* MOBIL: Feed up uslubidagi yagona ko'k header.
           1-qator: logo markazda (oq).
           2-qator: chapda til tugmasi, markazda buyurtma turi, o'ngda tema. */
        <header ref={hdrRef} className="relative z-[31] text-white">
          <div className="max-w-[1240px] mx-auto">
            <div>
              <div className="flex items-center justify-center px-4 pt-1.5 pb-1">
                <button onClick={() => nav('/')} aria-label="Tekit Sushi"
                  className="press flex items-center gap-2 min-w-0 active:opacity-80 transition-opacity">
                  <img src="/logo-light.png" alt="Tekit Sushi" width={34} height={34}
                    className="w-[34px] h-[34px] object-contain" />
                  <span className="text-[15px] font-extrabold tracking-[0.08em] whitespace-nowrap">TEKIT SUSHI</span>
                </button>
              </div>
            </div>
          </div>
          {/* 2-qator: 3 ustunli grid — chapda til tugmasi, MARKAZDA buyurtma turi,
              o'ngda tema almashtirgich. Pill ekranning aniq o'rtasida turadi. */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center px-4 pt-1 pb-2.5 max-w-[1240px] mx-auto">
            {/* Chapda til tugmasi: o'ngdagi tema tugmasi bilan bir xil o'lcham/uslub */}
            <button onClick={() => { haptic(); setLangOpen(true) }} aria-label={t.language} aria-haspopup="dialog"
              className="press focus-ring w-11 h-11 justify-self-start grid place-items-center rounded-full bg-[var(--hdr-chip)] active:scale-95 transition-transform">
              <FlagOf l={lang} s={22} />
            </button>
            <div className="min-w-0 justify-self-center max-w-full">
              <button onClick={toggleSel} aria-expanded={selOpen}
                className="press focus-ring flex items-center gap-1.5 h-10 pl-4 pr-3 rounded-full bg-[var(--hdr-chip)] text-[14px] font-extrabold text-white active:scale-[.97] transition-transform min-w-0 max-w-full">
                <span className="truncate">{mode === 'delivery' ? t.fcDel : mode === 'pickup' ? t.fcPick : t.orderType}</span>
                <span className={`transition-transform duration-150 shrink-0 ${selOpen ? 'rotate-90' : ''}`}><IcChevR s={12} /></span>
              </button>
            </div>
            <div className="justify-self-end"><ThemeToggle variant="header" /></div>
          </div>
          {/* Tanlov paneli: OVERLAY — header ostida mutlaq joylashadi, faqat
              transform/opacity bilan animatsiya qilinadi, header balandligi
              O'ZGARMAYDI va sahifa qayta joylashmaydi (iOS/Android silliq).
              Remountsiz: doim DOM'da, visibility/pointer-events bilan boshqariladi. */}
          <div className={`tk-sel-pop ${selOpen ? 'is-open' : ''} ${selAnim ? 'is-anim' : ''}`}>
            <div className="px-3 pb-2.5 pt-0.5 max-w-[1240px] mx-auto">
              <div role="group" aria-label="order-type" className="flex items-center gap-1 rounded-full bg-[var(--hdr-chip)] p-1">
                {ORDER_MODES.map(m => {
                  const on = mode === m
                  return (
                    <button key={m} aria-pressed={on}
                      onClick={() => chooseMode(m)}
                      className={`press focus-ring flex flex-1 items-center justify-center gap-1.5 h-8 rounded-full px-3 text-[12px] font-extrabold whitespace-nowrap transition-colors ${on ? 'bg-[var(--hdr-chip-on)] text-[var(--hdr-chip-on-ink)]' : 'text-white active:bg-white/10'}`}>
                      {m === 'delivery' ? <IcTruck s={16} /> : <IcStore s={16} />}
                      {m === 'delivery' ? t.fcDel : t.fcPick}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </header>
      )}
      <DeliveryModal open={delOpen} onClose={() => setDelOpen(false)} switchTo={() => { setDelOpen(false); setPickOpen(true) }} />
      <PickupModal open={pickOpen} onClose={() => setPickOpen(false)} switchTo={() => { setPickOpen(false); setDelOpen(true) }} />
      <LangSheet open={langOpen} onClose={() => setLangOpen(false)} />
      {askOpen && (
        <InitialChoiceModal
          open
          onClose={() => { try { localStorage.setItem('tk-onboarded', '1') } catch {} setAskState(false) }}
          onPick={(m) => {
            try { localStorage.setItem('tk-onboarded', '1') } catch {}
            setAskState(false)
            // tanlov qilingach mos qadam ochiladi: manzil yoki filial tanlovi
            if (m === 'delivery') setDelOpen(true); else setPickOpen(true)
          }}
        />
      )}
    </>
  )
}

const ORDER_MODES = ['delivery', 'pickup'] as const

/* ---------- rejim almashtirish: Profile ekranida yashaydi (headerdan ko'chirildi) ---------- */
export function ModeSwitcher() {
  const { t, mode } = useStore()
  const [delOpen, setDelOpen] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  return (
    <>
      <div className="grid grid-cols-2 gap-2">
        {(['delivery', 'pickup'] as const).map(m => (
          <button key={m} aria-haspopup="dialog"
            onClick={() => { haptic('light'); if (m === 'delivery') setDelOpen(true); else setPickOpen(true) }}
            className={`press flex items-center justify-center gap-1.5 py-2.5 rounded-full text-[14px] font-bold transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
            {m === 'delivery' ? <IcTruck s={15} /> : <IcStore s={15} />}{m === 'delivery' ? t.deliveryMode : t.pickup}
          </button>
        ))}
      </div>
      <DeliveryModal open={delOpen} onClose={() => setDelOpen(false)} switchTo={() => { setDelOpen(false); setPickOpen(true) }} />
      <PickupModal open={pickOpen} onClose={() => setPickOpen(false)} switchTo={() => { setPickOpen(false); setDelOpen(true) }} />
    </>
  )
}

/* ---------- bir martalik shahar banneri ---------- */
export function CityBanner() {
  const { t } = useStore()
  const [ok, setOk] = useState(() => { try { return localStorage.getItem('tk-city-ok') === '1' } catch { return false } })
  const wrapRef = useRef<HTMLDivElement | null>(null)
  /* Banner tashqarisidagi bosish bilan yopiladi, lekin hech narsani bloklamaydi.
     Avvalgi butun ekranli ko'rinmas qatlam (fixed inset-0 z-44) sticky qatordagi
     hamburger va sahifa bosishlarini yutib qo'yardi — burger "isblemay qolardi". */
  useEffect(() => {
    if (ok) return
    const fn = (e: PointerEvent) => {
      if (wrapRef.current && wrapRef.current.contains(e.target as Node)) return
      try { localStorage.setItem('tk-city-ok', '1') } catch {}
      setOk(true)
    }
    window.addEventListener('pointerdown', fn)
    return () => window.removeEventListener('pointerdown', fn)
  }, [ok])
  if (ok) return null
  return (
    <>
      <div ref={wrapRef} className="fixed left-1/2 -translate-x-1/2 z-[45] w-[calc(100%-24px)] max-w-[420px]" style={{ top: 'calc(var(--hdr-h, 160px) + 8px)' }}>
      <div className="flex items-center gap-3 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3 shadow-[0_18px_44px_-14px_rgba(0,0,0,.6)]">
        <span className="text-[var(--acc)] shrink-0"><IcPin /></span>
        <div className="flex-1 text-[14px] font-bold text-[var(--ink)] leading-snug">{t.cityNote}</div>
        <button onClick={() => { try { localStorage.setItem('tk-city-ok', '1') } catch {}; setOk(true) }}
          className="press shrink-0 bg-[var(--chip-on)] text-[var(--chip-on-ink)] text-[13.5px] font-extrabold px-3.5 py-2 rounded-xl active:scale-95 transition-transform">
          {t.cityOk}
        </button>
      </div>
    </div>
    </>
  )
}

/* ---------- Bosh sahifa: ixcham qidiruv + kategoriya chiplari (sticky qator ichida) ---------- */
export function CatalogNav({ q, setQ, chips, active, onSelect }: {
  q: string; setQ: (s: string) => void
  chips: { id: string; label: string }[]
  active: string | null
  onSelect: (id: string) => void
}) {
  const { t } = useStore()
  const [open, setOpen] = useState(false)
  const stripRef = useRef<HTMLDivElement>(null)
  const chipRefs = useRef<Record<string, HTMLButtonElement | null>>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const kbT = useRef<number | null>(null)

  /* Klaviatura ko'tarilganda navbar va suzuvchi boshqaruvlar yashiriladi
     (html[data-kb]). BU endi birinchi kadrda emas, ochilish animatsiyasi
     tugagach (230ms) qo'llanadi — aks holda navbar yashirilishi bilan bir
     vaqtda reflow sodir bo'ladi va sakrash sezilar edi. */
  const setKb = (on: boolean) => {
    try { if (on) document.documentElement.dataset.kb = '1'; else delete document.documentElement.dataset.kb } catch {}
  }
  /* Ochish: input doim DOM'da — fokus SINXRON, tap handler ICHIDA.
     iOS/Android klaviaturasi shu sababli kechikmaydi. */
  const activeRef = useRef(false)
  const openSearch = () => {
    activeRef.current = true
    setOpen(true)
    /* Klaviatura avtomatik ochilsin: maydon ochilgach yana bir necha marta
       fokus beriladi — birinchi urinish yashirin qatlamga tushib qolsa ham
       keyingisi klaviaturani ochadi. */
    const focusInput = () => {
      if (!activeRef.current) return
      try { inputRef.current?.focus({ preventScroll: true } as FocusOptions) } catch {}
    }
    focusInput()
    requestAnimationFrame(() => { focusInput(); window.setTimeout(focusInput, 90) })
    if (kbT.current) window.clearTimeout(kbT.current)
    kbT.current = window.setTimeout(() => setKb(true), 230)
  }
  const closeSearch = () => {
    activeRef.current = false
    setQ('')
    try { inputRef.current?.blur() } catch {}
    setKb(false)
    if (kbT.current) { window.clearTimeout(kbT.current); kbT.current = null }
    setOpen(false)
  }
  useEffect(() => () => { if (kbT.current) window.clearTimeout(kbT.current); setKb(false) }, [])

  // faol kategoriya stripda ko'rinadigan joyda turadi
  useEffect(() => {
    if (open || !active) return
    const align = () => {
      const strip = stripRef.current
      const el = chipRefs.current[active]
      if (!strip || !el) return
      // To'g'ri koordinata maydoni: offsetLeft eng yaqin POZITSIYALANGAN ajdodga
      // (sticky qator) nisbatan bo'ladi va burger+qidiruv kengligini ham sanaydi —
      // bu ortiqcha skroll va chipning qidiruv ostiga sirg'alib kirishiga sabab
      // bo'lardi. Chipning strip ICHIDAGI holatini rect orqali hisoblaymiz.
      // Chip to'liq ko'rinsa qator UMUMAN siljimaydi — skroll davomida qator
      // foydalanuvchi barmog'i bilan kurashmaydi (jitter yo'q).
      const sr = strip.getBoundingClientRect()
      const er = el.getBoundingClientRect()
      if (er.left >= sr.left + 4 && er.right <= sr.right - 4) return
      const left = er.left - sr.left + strip.scrollLeft
      // Chipta ko'rinmayotgan tomondan MINIMAL siljish bilan ko'rinadigan qilamiz
      const max = strip.scrollWidth - strip.clientWidth
      const target = er.left < sr.left
        ? Math.max(0, Math.min(left - 12, max))
        : Math.max(0, Math.min(left + el.offsetWidth - strip.clientWidth + 12, max))
      if (Math.abs(strip.scrollLeft - target) > 6) {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        strip.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' })
      }
    }
    // Faol chip o'zgarsa bir zum kutamiz: tez skroll davomida har bo'lim
    // o'zgarishida qator sudralib yurishi jitter beradi.
    const t0 = window.setTimeout(align, 180)
    // Strip va chip o'lchamlari o'zgarsa (shrift yuklanishi, sidebar ochilishi,
    // oyna kengligi) qayta tekislanadi; shriftlar kech yuksalganda ham joy to'g'ri qoladi.
    // Sidebar kengligi har kadrda o'zgarganda ResizeObserver har kadrda o'qishni
    // boshlatmasligi uchun kichik "oxirgi o'zgarishdan keyin" kechikishi bor:
    // animatsiya tugagach bir marta tekislanadi, har kadrda majburiy layout bo'lmaydi.
    const strip = stripRef.current
    if (!strip || typeof ResizeObserver !== 'function') return
    let t = 0
    const ro = new ResizeObserver(() => { window.clearTimeout(t); t = window.setTimeout(align, 140) })
    ro.observe(strip)
    const chipUnobs = chips.map(c => { const el = chipRefs.current[c.id]; if (el) ro.observe(el) })
    document.fonts?.ready?.then(align).catch(() => {})
    return () => { ro.disconnect(); window.clearTimeout(t); window.clearTimeout(t0); void chipUnobs }
  }, [active, open, chips.length])

  return (
    <div>
      <div className="max-w-[1240px] mx-auto px-4 lg:px-6 py-2.5">
        {/* O'ZGARMAS balandlikdagi bitta quti: ikkala holat ham SHU joyda.
            Qator almashinuvi remountsiz — header va sahifa balandligi
            hech qachon o'zgarmaydi (sakrash yo'q). */}
        <div className="relative h-[40px]">
          {/* 1-qatlam: qidiruv tugmasi + kategoriya chiplari.
              Ochilganda fade + tepaga siljish (faqat transform/opacity). */}
          <div className={`tk-search-row absolute inset-0 flex items-center gap-2.5 ${open ? 'is-out' : ''}`} aria-hidden={open || undefined}>
            <button onClick={openSearch} aria-label={t.search} aria-expanded={open} tabIndex={open ? -1 : undefined}
              className={`tk-search-btn press focus-ring ${chips.length ? 'flex-none flex items-center justify-center gap-2 h-[40px] w-[40px] lg:w-auto lg:px-4' : 'flex-1 min-w-0 flex items-center gap-2.5 h-[40px] px-4 text-left'} rounded-full`}>
              <IcSearch s={17} />
              <span className={chips.length ? 'hidden lg:inline text-[14px] font-medium' : 'text-[15px] font-medium'}>{t.search}</span>
            </button>
            {chips.length > 0 && (
            <div ref={stripRef} className="min-w-0 flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label={t.menuT}>
              {chips.map(c => (
                <button key={c.id} ref={el => { chipRefs.current[c.id] = el }} role="tab" aria-selected={active === c.id}
                  onClick={() => onSelect(c.id)} tabIndex={open ? -1 : undefined}
                  className={`press focus-ring flex-none h-[40px] px-4 rounded-full text-[14px] font-bold whitespace-nowrap transition-colors ${active === c.id ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                  {c.label}
                </button>
              ))}
            </div>
            )}
          </div>
          {/* 2-qatlam: qidiruv maydoni. Doim DOM'da, faqat transform/opacity/
              clip-path bilan ko'rinadi — qidiruv tugmasi inputga aylanib ochiladi.
              Hech qanday width/height animatsiyasi yo'q, sahifa ta'sirlanmaydi. */}
          <div className={`tk-search-field absolute inset-0 flex items-center gap-1.5 ${open ? 'is-in' : ''}`} aria-hidden={!open || undefined}>
            <div className="relative flex-1 min-w-0">
              <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search}
                tabIndex={open ? undefined : -1}
                onKeyDown={e => { if (e.key === 'Escape') { e.preventDefault(); closeSearch() } }}
                onBlur={() => { setKb(false); if (open) closeSearch() }}
                className="w-full bg-[var(--panel)] border border-[var(--line2)] rounded-full h-[40px] pl-11 pr-11 text-[15px] font-medium text-[var(--ink)] placeholder:text-[var(--mut2)] outline-none focus:border-[var(--acc)] focus:ring-2 focus:ring-[var(--acc-ring)]" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mut2)]"><IcSearch /></span>
              <button onClick={closeSearch} aria-label="close-search" tabIndex={open ? undefined : -1}
                className="press focus-ring absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-[var(--mut2)] active:scale-90 transition-transform">
                <IcX s={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ---------- vaqtinchalik rating qiymatlari (ma'lumot kelganda almashtiriladi) ---------- */

/* ---------- promo slayder ---------- */
const SLIDES: { img: string; b: 'heroB1' | 'heroB2' | 'heroB3' | 'heroB4'; ti: 'heroT1' | 'heroT2' | 'heroT3' | 'heroT4'; s: 'heroS1' | 'heroS2' | 'heroS3' | 'heroS4'; to: string }[] = [
  { img: CDN + '2705b64b-3608-4b1b-bd69-adeb50ff7151', b: 'heroB1', ti: 'heroT1', s: 'heroS1', to: '/' },
  { img: CDN + '0c72e513-3fb1-43e1-9577-f89b156d45eb', b: 'heroB2', ti: 'heroT2', s: 'heroS2', to: '/' },
  { img: CDN + '4f6ef42a-e6ed-424d-80d2-8ae96078d201', b: 'heroB3', ti: 'heroT3', s: 'heroS3', to: '/cat/hit' },
  { img: CDN + '4dd85d27-a179-4483-816e-99ddede741e8', b: 'heroB4', ti: 'heroT4', s: 'heroS4', to: '/cat/set' },
]

/* ---------- markazda almashib turadigan cheksiz karusel ---------- */
export function HeroSlider() {
  const { t } = useStore()
  const nav = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)
  const [w, setW] = useState(0)
  const [i, setI] = useState(1) // 1..n, klonlar: [oxirgi, ...slaydlar, birinchi]
  const [anim, setAnim] = useState(true)
  const timer = useRef<number | null>(null)
  const touch = useRef<{ x: number; y: number } | null>(null)
  const n = SLIDES.length

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setW(el.clientWidth))
    ro.observe(el); setW(el.clientWidth)
    return () => ro.disconnect()
  }, [])

  const stop = () => { if (timer.current) { clearInterval(timer.current); timer.current = null } }
  const start = () => { stop(); timer.current = window.setInterval(() => setI(v => Math.min(v + 1, n + 1)), 5200) }
  useEffect(() => { start(); return stop }, [])

  const go = (k: number) => { setI(Math.max(0, Math.min(n + 1, k))); start() }

  // klonlardan haqiqiy slaydga sakrash
  const onEnd = () => {
    if (i === n + 1) { setAnim(false); setI(1) }
    else if (i === 0) { setAnim(false); setI(n) }
  }
  useEffect(() => {
    if (anim) return
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setAnim(true)))
    return () => cancelAnimationFrame(id)
  }, [anim])

  const onTouchStart = (e: React.TouchEvent) => { stop(); touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY } }
  const onTouchEnd = (e: React.TouchEvent) => {
    const t0 = touch.current; touch.current = null
    if (t0) {
      const dx = e.changedTouches[0].clientX - t0.x
      const dy = e.changedTouches[0].clientY - t0.y
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) { setI(v => Math.max(0, Math.min(n + 1, v + (dx < 0 ? 1 : -1)))); haptic('light') }
    }
    start()
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const P = 0 // qo'shni slaydning nozik "sliver" ko'rinishi olib tashlandi: banner to'liq kenglikda
  const G = 10
  const slideW = Math.max(0, w - 2 * P)
  const offset = P - i * (slideW + G)
  const shown = [SLIDES[n - 1], ...SLIDES, SLIDES[0]]
  const dot = ((i - 1) % n + n) % n

  return (
    <div className="mt-3 lg:mt-5 px-4 lg:px-6 select-none">
      <div ref={wrapRef} className="relative h-[196px] lg:h-auto lg:aspect-[3.2/1] lg:min-h-[240px] lg:max-h-[380px] overflow-hidden rounded-[20px] bg-[var(--sheet)]">
        {w > 0 && (
        <div
          onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}
          onTransitionEnd={onEnd}
          className="flex h-full will-change-transform"
          style={{ gap: G, transform: `translateX(${offset}px)`, transition: anim && !reducedMotion ? 'transform 520ms cubic-bezier(.22,.61,.36,1)' : 'none' }}
        >
          {shown.map((sl, k) => (
            <div key={k} style={{ width: slideW }} onClick={() => { haptic(); nav(sl.to) }}
              className="shrink-0 h-full relative rounded-[20px] overflow-hidden cursor-pointer bg-[var(--sheet)]">
              <img src={sl.img} alt="" loading={k === 1 ? 'eager' : 'lazy'} decoding="async"
                className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0B1220]/85 via-[#0B1220]/40 to-transparent" />
              <div className="relative h-full flex items-end lg:items-center pl-5 lg:pl-10 pr-4 lg:pr-6 pb-4 lg:pb-0">
                <div className="max-w-[75%] lg:max-w-[55%]">
                  <span className="inline-block bg-[var(--acc)] text-white px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-extrabold uppercase tracking-[0.14em]">{(t as any)[sl.b]}</span>
                  <div className="mt-2 lg:mt-3.5 text-[20px] lg:text-[34px] font-extrabold leading-[1.1] tracking-tight text-white">{(t as any)[sl.ti]}</div>
                  <div className="mt-1.5 text-[11.5px] lg:text-[14px] font-medium text-white/75 leading-snug">{(t as any)[sl.s]}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      {w > 0 && (
      <div className="mt-3 flex justify-center gap-1.5">
        {SLIDES.map((_, k) => (
          <button key={k} onClick={e => { e.stopPropagation(); go(k + 1) }}
            className={`h-2 rounded-full transition-all duration-300 ${k === dot ? 'w-5 bg-navy' : 'w-2 bg-[var(--line2)]'}`} />
        ))}
      </div>
      )}
    </div>
  )
}

/* ---------- pastki navbar: suzuvchi oval, shaffof oyna (glass), slayd indikator.
   Ikonkalar noldan chizilgan — stroke, 24 grid, yagona uslub; ranglari temadan
   o'qiladi (light: ko'k pill/oq ikonka, dark: oq pill/to'q ikonka). ---------- */
export const IcNavHome = ({ s = 23 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4.2 11.3 12 4.7l7.8 6.6" />
    <path d="M5.8 10.4V19a1.6 1.6 0 0 0 1.6 1.6h9.2a1.6 1.6 0 0 0 1.6-1.6v-8.6" />
    <path d="M9.9 20.4v-4c0-1.2 1-2.2 2.1-2.2s2.1 1 2.1 2.2v4" />
  </svg>
)
export const IcNavCart = ({ s = 23 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M6.2 8.2h11.6l-.9 11c-.1 1-1 1.9-2 1.9H9.1c-1 0-1.9-.8-2-1.9l-.9-11Z" />
    <path d="M9.2 10.5V6.8c0-1.6 1.3-2.9 2.8-2.9s2.8 1.3 2.8 2.9v3.7" />
  </svg>
)
/* korzina: yoy dastakli savat, xarocho'q chiziqlar bilan */
export const IcNavBasket = ({ s = 23 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M8.6 9c.1-3.6 1.5-5.6 3.4-5.6s3.3 2 3.4 5.6" />
    <path d="M4.9 9h14.2l-1.4 10.2c-.2 1.3-1.2 2.3-2.5 2.3H8.8c-1.3 0-2.3-1-2.5-2.3L4.9 9Z" />
    <path d="M9.2 12.4l5.6 7" />
    <path d="M14.8 12.4l-5.6 7" />
  </svg>
)
export const IcNavOrders = ({ s = 23 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="8.2" />
    <path d="M12 7.4V12l3 1.9" />
  </svg>
)
export const IcNavProfile = ({ s = 23 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="8.1" r="3.4" />
    <path d="M5.3 20.2c.9-3.3 3.6-5.2 6.7-5.2s5.8 1.9 6.7 5.2" />
  </svg>
)

export function TabBar() {
  const { t, cartCount, ordersActiveCount } = useStore()
  const nav = useNavigate()
  const beat = useCartBeat()
  const loc = useLocation().pathname
  if (loc.startsWith('/p/')) return null
  const tabs = [
    { id: 'home', to: '/', label: t.tabHome, Ico: IcNavHome },
    { id: 'cart', to: '/cart', label: t.tabCart, Ico: () => <IcBag s={23} /> },
    { id: 'orders', to: '/orders', label: t.tabOrders, Ico: IcNavOrders },
    { id: 'profile', to: '/profile', label: t.tabProfile, Ico: IcNavProfile },
  ]
  const onIdx = tabs.findIndex(tb => loc === tb.to)
  return (
    <nav className="tk-tabbar lg:hidden" aria-label={t.menuT}>
      <div className="tk-tab-pill">
        <span className="tk-tab-ind" aria-hidden="true"
          style={{ transform: `translateX(${Math.max(onIdx, 0) * 100}%)`, opacity: onIdx < 0 ? 0 : 1 }} />
        {tabs.map(({ id, to, label, Ico }) => {
          const on = loc === to
          return (
            <button key={id} onClick={() => { if (!on) { haptic(); nav(to, { replace: true }) } }}
              aria-current={on ? 'page' : undefined}
              className={`tk-tab-btn ${id === 'cart' ? 'no-pop ' : ''}${on ? 'is-on' : ''}`}>
              <span className="tk-tab-ico relative">
                <Ico />
                {id === 'cart' && cartCount > 0 && (
                  <span key={'tb' + beat} className={`absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-[#E8462B] text-white text-[9.5px] font-extrabold grid place-items-center leading-none px-1 ${beat ? 'cart-beat' : ''}`}>{cartCount}</span>
                )}
                {id === 'orders' && ordersActiveCount > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] rounded-full bg-[#E8462B] text-white text-[9.5px] font-extrabold grid place-items-center leading-none px-1">{ordersActiveCount}</span>
                )}
              </span>
              <span className="tk-tab-lbl">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

/* ---------- mahsulot kartochkasi: rasmda faqat vazirlik, reyting/Hit/yurak
   modalda qoladi. Narx qatorda: amaldagi narx eng yorqin, eski narx kichik
   chizilgan, chegirma foizi faqat haqiqiy qiymatlar bo'yicha. Savatda bor
   mahsulot ingichka brend ramkasi bilan ajraladi. ---------- */
/* ---------- achchiq belgisi: qalampir, tepasida jonli alanga.
   Emoji va Lucide emas — loyihaning o'z chizmasi. Harakat faqat
   alangada: mayda miltillash + ember nur (reduced-motion'da jim). ---------- */
export function IcChili({ s = 16, className }: { s?: number; className?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M13.9 1.2c2 2 3 3.6 3 5 0 1.8-1.3 3-3 3s-3-1.2-3-3c0-1.4 1-3 3-5z" fill="#FFB020" />
      <path d="M13.9 4.1c.9 1 1.4 1.7 1.4 2.3 0 .8-.6 1.3-1.4 1.3s-1.4-.5-1.4-1.3c0-.6.5-1.3 1.4-2.3z" fill="#FF7A1A" />
      <path d="M20.2 6.8c2.1 1.7 2 4.6.2 7.4-2.4 3.8-6.9 6.6-11.4 6.1-2.4-.3-4.2-1.4-4.9-2.9 1.3.4 3.1.2 5-.6 4.2-1.8 7.6-5.1 8.9-8.3.5-1.1 1.4-2.2 2.2-1.7z" fill="#E8462B" />
      <path d="M20.2 6.8c-.8-.5-1.7.6-2.2 1.7-.5 1.1-1.2 2.3-2.2 3.5.3-2 1.5-4.6 4.4-5.2z" fill="#FF7A5A" opacity=".5" />
      <path d="M20.6 5.4c1-.6 2.2-.8 3.2-.5-.5 1.1-1.5 2-2.7 2.2-.4.1-.9 0-1.2-.1.2-.6.4-1.2.7-1.6z" fill="#3E8E3E" />
    </svg>
  )
}

export function SpicyBadge({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <span aria-label="Achchiq" title="Achchiq"
      className={`relative inline-flex items-center justify-center shrink-0 ${className || ''}`}
      style={{ width: size, height: size }}>
      <IcChili s={size} />
    </span>
  )
}

/* React.memo: kategoriya almashganda Home qayta render bo'lsa ham propsi
   o'zgarmagan kartalar qayta chizilmaydi — ro'yxatdagi "qotish" shundan edi. */
export const ProductCard = React.memo(function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, setQty, lang, t, openP } = useStore()
  const imgRef = useRef<HTMLImageElement | null>(null) // savatga uchish animatsiyasi manbasi
  const desk = useIsDesktop()
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  const inCart = q > 0
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  const salePct = sale ? (p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)) : 0
  const wtxt = p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')
  // muvaffaqiyatli qo'shishda tugmada qisqa tasdiq belgisi; tez bosishlarda taymer faqat yangilanadi.
  // anim: shu qo'shish uchun tanlangan variant (addAnim.ts) — bir marta tanlanadi,
  // qayta renderda o'zgarmaydi; tez bosishlarda birlashtiriladi (yangi variant tanlanmaydi)
  const [ok, setOk] = useState(false)
  // anim: yagona chapdan-o'ngga savat yo'nalishi (addAnim.ts) — faqat muvaffaqiyatli
  // qo'shishda o'ynaydi; tez bosishlarda birlashtiriladi, timer faqat yangilanadi
  const [anim, setAnim] = useState<number | null>(null)
  const okTimer = useRef<number | null>(null)
  useEffect(() => () => { if (okTimer.current) window.clearTimeout(okTimer.current) }, [])
  // Interaktivlik davomida mahsulot savatdan olib tashlangan bo'lsa (boshqa kartochka,
  // savat sahifasi va h.k.) eskirgan "qo'shildi" tasdig'i qolmasin: darhol bazaviy holat.
  useEffect(() => { if (!inCart && ok) { setOk(false); setAnim(null) } }, [inCart, ok])
  const onAdd = (el?: HTMLElement | null) => {
    add(p.id); haptic('medium'); setOk(true)
    const res = beginAddToCartAnim(el)
    if (res) { setAnim(res.k); flyProductToCart(imgRef.current) }
    if (okTimer.current) window.clearTimeout(okTimer.current)
    okTimer.current = window.setTimeout(() => { setOk(false); setAnim(null) }, 810)
  }
  return (
    <article data-pc={p.id} onClick={() => { haptic(); openP(p) }}
      className="anim-up cursor-pointer relative flex flex-col h-full"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className={`relative aspect-square rounded-[12px] overflow-hidden bg-[var(--sheet)] shrink-0 ${inCart ? 'ring-1 ring-inset ring-[var(--chip-on)]/45' : ''}`}>
        <img ref={imgRef} src={pImg(p) || undefined} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        {wtxt && <span className="absolute bottom-2 left-2 bg-black/45 text-white text-[11px] font-bold px-2 py-1 rounded-[8px] backdrop-blur-[2px]">{wtxt}</span>}
        {isSpicy(p) && <SpicyBadge size={26} className="absolute top-2 right-2 tk-spicy-ember bg-black/40 backdrop-blur-[2px] shadow-sm" />}
        {inCart && !desk && (
          <span className="absolute top-2 left-2 min-w-[22px] h-[22px] px-1.5 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] text-[12px] font-extrabold grid place-items-center leading-none shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)]">{q}</span>
        )}
      </div>
      <div className="mt-auto pt-2 flex flex-col">
        <div className="text-[15px] font-bold leading-snug text-[var(--ink)] line-clamp-2">{pName(p, lang)}</div>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className={`text-[16px] font-extrabold tracking-tight whitespace-nowrap ${sale ? 'text-[var(--promo-deep)]' : 'text-[var(--ink)]'}`}>{fmt(p.price)}</span>
          <span className="text-[11px] font-bold text-[var(--mut2)]">UZS</span>
          {sale && (
            <>
              <span className="text-[12px] font-bold text-[var(--mut2)] line-through whitespace-nowrap">{fmt(p.old_price)}</span>
              <span className="text-[10.5px] font-extrabold px-1.5 py-0.5 rounded-md bg-[var(--promo)] text-[var(--promo-ink)] leading-none">−{salePct}%</span>
            </>
          )}
        </div>
        {/* Bosilanda popap OCHILMAYDI: darhol savatga qo'shadi (rasmi suzuvchi savatga uchadi);
            tasdiq ko'rinib bo'lgach miqdor boshqaruvi chiqadi. Batafsil ma'lumot uchun kartochkaning o'zi bosiladi */}
        {inCart && !ok ? (
          <QtyStepper full className="mt-1.5" q={q} min={0}
            onDec={() => { setQty(p.id, q - 1); haptic('light') }}
            onInc={() => { add(p.id); haptic('medium') }} />
        ) : (
          <button onClick={e => { e.stopPropagation(); onAdd(e.currentTarget) }}
            className={`press mt-1.5 relative overflow-hidden w-full h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-extrabold active:scale-[.98] transition-transform ${ok && anim != null ? 'tk-add-active' : ''} ${sale ? 'bg-[var(--promo-deep)] text-white hover:brightness-110' : 'bg-[var(--btn)] text-[var(--btn-ink)]'}`}>
            {ok ? (anim != null ? null : <span className="add-ok grid place-items-center"><IcCheck s={17} /></span>) : <IcBag s={17} />}
            <span className="tk-add-label">{t.cardAdd}</span>
            {ok && anim != null && <CartJourney k={anim} />}
          </button>
        )}
      </div>
    </article>
  )
})

export function Sheet({ open, onClose, title, children, foot }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; foot?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const unlock = lockPageScroll()
    return unlock
  }, [open])

  // Pastga surib yopish (surgich zonasi: dastak + sarlavha)
  const [dy, setDy] = React.useState(0)
  const [drag, setDrag] = React.useState(false)
  const [entered, setEntered] = React.useState(false)
  const st = React.useRef<{ y0: number; y: number; t: number } | null>(null)
  const vel = React.useRef(0)
  const bgDown = React.useRef<{ x: number; y: number } | null>(null)
  const timer = React.useRef<number | null>(null)

  useEffect(() => {
    const id = window.setTimeout(() => setEntered(true), 520)
    return () => clearTimeout(id)
  }, [])
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])
  // Surib yopilganda holat tozalanadi: aks holda qayta ochilganda modal ko'rinmas va tegmas bo'lib qolardi
  useEffect(() => {
    if (open) return
    setDy(0); setDrag(false); st.current = null
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
  }, [open])

  const onDown = (e: React.TouchEvent) => {
    if (timer.current) return
    st.current = { y0: e.touches[0].clientY, y: e.touches[0].clientY, t: performance.now() }
    vel.current = 0
    setDrag(true)
  }
  const onMove = (e: React.TouchEvent) => {
    if (!st.current) return
    const y = e.touches[0].clientY
    const now = performance.now()
    const dt = now - st.current.t
    if (dt >= 8) vel.current = ((y - st.current.y) / dt) * 0.35 + vel.current * 0.65
    st.current = { ...st.current, y, t: now }
    let d = y - st.current.y0
    if (d < 0) d = 0
    else if (d > 260) d = 260 + (d - 260) * 0.15
    setDy(d)
  }
  const onEnd = () => {
    if (!st.current) return
    const d = dy
    st.current = null
    setDrag(false)
    const fast = vel.current > 1.0
    if (d > 130 || (fast && d > 36)) {
      setDy(window.innerHeight + 80)
      timer.current = window.setTimeout(onClose, 300)
    } else {
      setDy(0)
    }
  }

  if (!open) return null
  const moving = drag || dy > 0
  return createPortal(
    <div className="fixed inset-0 z-50">
      {/* Fon: bosilgan joydan siljigan holda bo'shlatilsa yopilmaydi (skroll tasodifiy yopilish) */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onPointerDown={e => { bgDown.current = { x: e.clientX, y: e.clientY } }}
        onClick={e => {
          const d = bgDown.current
          bgDown.current = null
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) return
          onClose()
        }}
        style={{ opacity: Math.max(0, 1 - dy / 420), transition: drag ? 'none' : 'opacity .3s' }} />
      <div role="dialog" aria-modal="true"
        className={`${!entered && !moving ? 'anim-sheet ' : ''}absolute left-0 right-0 bottom-0 bg-[var(--sheet)] rounded-t-[26px] max-h-[90dvh] flex flex-col shadow-[0_-20px_60px_rgba(10,15,50,.25)] overscroll-contain select-none lg:top-0 lg:animate-none lg:h-fit lg:w-[480px] lg:mx-auto lg:rounded-[26px] lg:shadow-[0_24px_60px_rgba(10,15,50,.3)]`}
        style={{ transform: `translateY(${dy}px)`, transition: drag ? 'none' : 'transform .32s cubic-bezier(.32,.72,0,1)' }}>
        <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
          style={{ touchAction: 'none' }}>
          <div className="pt-2.5 pb-1">
            <div className="w-10 h-1.5 rounded-full bg-[var(--line2)] mx-auto" />
          </div>
          <div className="flex items-center justify-between px-5 pt-1.5 pb-1">
            <h3 className="text-[18px] font-extrabold">{title}</h3>
            <button onClick={onClose} className="press w-8 h-8 rounded-full bg-navy-soft grid place-items-center text-[var(--mut2)]"><IcX /></button>
          </div>
        </div>
        <div className="overflow-y-auto no-scrollbar px-5 py-3 flex-1 overscroll-contain">{children}</div>
        {foot && <div style={{ paddingBottom: 'calc(14px + var(--sab))' }} className="px-5 pt-2">{foot}</div>}
      </div>
    </div>,
    document.body
  )
}

export function Empty({ emoji, icon, title, sub, action }: { emoji?: string; icon?: React.ReactNode; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="py-14 text-center">
      <div className="relative w-28 h-28 mx-auto">
        <div className="absolute -inset-4 rounded-full bg-navy-soft/70 blur-2xl opacity-80" />
        <div className="relative tekit-pattern w-28 h-28 rounded-[30px] grid place-items-center text-white shadow-[0_16px_34px_-14px_rgba(15,30,154,.45)]">{icon || <IcPlate />}</div>
      </div>
      <div className="mt-5 text-[17px] font-extrabold">{title}</div>
      {sub && <div className="mt-1.5 text-[14px] font-medium text-[var(--mut2)] max-w-[300px] mx-auto leading-relaxed">{sub}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function BigButton({ children, onClick, disabled, ghost, type }: {
  children: React.ReactNode; onClick?: () => void; disabled?: boolean; ghost?: boolean; type?: 'button' | 'submit'
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`press w-full py-4 rounded-2xl text-[16px] font-extrabold flex items-center justify-center gap-2 transition-all
        ${ghost ? 'bg-[var(--bg2)] text-[var(--ink)] border border-navy-line' : 'bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_10px_22px_-8px_rgba(15,30,154,.6)]'} disabled:opacity-40`}>
      {children}
    </button>
  )
}

/* ---------- yagona miqdor boshqaruvi: kartochka, mahsulot modali va savat uchun
   bir xil til. Raqam barqaror kenglikda (tabular-nums + min-ch) — raqam o'zgarganda
   siljish bo'lmaydi; cheklovlar chaqiruvchi tomondan beriladi (min=0: savatdagi
   oxirgi donani ham olib tashlashga ruxsat). Karta bosilganda modal ochilmasligi
   uchun stopPropagation konteynerda. ---------- */
export function QtyStepper({ q, onInc, onDec, min = 1, size = 'md', full, className }: {
  q: number; onInc: () => void; onDec: () => void; min?: number; size?: 'sm' | 'md' | 'lg'; full?: boolean; className?: string
}) {
  const cfg = size === 'sm'
    ? { box: 'p-1 gap-1 rounded-[12px]', btn: 'w-8 h-8 rounded-[10px]', ic: 13, txt: 'text-[14px]' }
    : size === 'lg'
    ? { box: 'p-1.5 gap-2 rounded-[16px]', btn: 'w-11 h-11 rounded-[13px]', ic: 18, txt: 'text-[16px]' }
    : { box: 'p-1 gap-1.5 rounded-[14px]', btn: 'w-9 h-9 rounded-[11px]', ic: 15, txt: 'text-[15px]' }
  const btn = `press focus-ring ${cfg.btn} grid place-items-center bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] [@media(hover:hover)]:hover:bg-navy-soft disabled:opacity-35 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer`
  return (
    <div onClick={e => e.stopPropagation()}
      className={`shrink-0 flex items-center bg-[var(--soft)] border border-[var(--line2)] ${cfg.box} ${full ? 'w-full justify-between' : ''} ${className || ''}`}>
      <button type="button" onClick={e => { onDec(); e.currentTarget.blur() }} disabled={q <= min} aria-label="minus" className={btn}>
        <IcMinus s={cfg.ic} />
      </button>
      <span className={`${cfg.txt} font-extrabold text-[var(--ink)] min-w-[2ch] text-center tabular-nums`}>{q}</span>
      {/* "+": yuqori chegarasi yo'q, shuning uchun hech qachon o'chmaydi
          (miqdor 0 ga tushganda ham ishlashi kerak) */}
      <button type="button" onClick={e => { onInc(); e.currentTarget.blur() }} aria-label="plus" className={btn}>
        <IcPlus s={cfg.ic} />
      </button>
    </div>
  )
}

export function Qty({ q, onInc, onDec, small, min = 1 }: { q: number; onInc: () => void; onDec: () => void; small?: boolean; min?: number }) {
  return <QtyStepper q={q} onInc={onInc} onDec={onDec} min={min} size={small ? 'sm' : 'md'} />
}

export function StatusChip({ status, label }: { status: string; label: string }) {
  const colors: Record<string, string> = {
    new: 'bg-amber-100 text-amber-700', confirmed: 'bg-blue-100 text-blue-700', cooking: 'bg-purple-100 text-purple-700',
    delivering: 'bg-indigo-100 text-indigo-700', done: 'bg-emerald-100 text-emerald-700', cancelled: 'bg-red-100 text-red-600',
  }
  return <span className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${colors[status] || 'bg-navy-soft text-navy-ink'}`}>{label}</span>
}

/* ---------- navigatsiya uchun keng ekran aniqlash (md+: push-sidebar zona) ---------- */
export function useIsWide() {
  const [w, setW] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width:768px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width:768px)')
    const f = () => setW(m.matches)
    m.addEventListener ? m.addEventListener('change', f) : m.addListener(f)
    return () => { m.removeEventListener ? m.removeEventListener('change', f) : m.removeListener(f) }
  }, [])
  return w
}

/* ---------- desktop aniqlash (modal uchun lg+) ---------- */
function useIsDesktop() {
  const [d, setD] = useState(() => typeof window !== 'undefined' && window.matchMedia('(min-width:1024px)').matches)
  useEffect(() => {
    const m = window.matchMedia('(min-width:1024px)')
    const f = () => setD(m.matches)
    m.addEventListener ? m.addEventListener('change', f) : m.addListener(f)
    return () => { m.removeEventListener ? m.removeEventListener('change', f) : m.removeListener(f) }
  }, [])
  return d
}

/* ---------- mahsulot modali: umumiy mantiq. Biznes qoidalari bir joyda:
   miqdor, souslar (savatda alohida qator), chegirma foizi, oziqlik faqat
   mavjud qiymatlar bo'yicha, tavsiyalar bir xil kategoriyadan. Ikkita
   taqdimot (mobil Sheet, desktop dialog) shu hook'dan foydalanadi. ---------- */
function useProductModal(p: Product | null) {
  const { lang, t, add, setQty, cart, products, openP } = useStore()
  const [q, setQ] = useState(1)
  // tez-qo'piq bosishlarda ortiqcha qator oldini oladi: ref sinxron himoya qiladi,
  // holat esa tugmaning ko'rinishini boshqaradi
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  // anim: yagona chapdan-o'ngga savat yo'nalishi (addAnim.ts) — faqat muvaffaqiyatli
  // qo'shishda o'ynaydi, rerenderda o'zgarmaydi; tez bosishlarda birlashtiriladi
  const [anim, setAnim] = useState<number | null>(null)
  const animTimer = useRef<number | null>(null)
  useEffect(() => () => { if (animTimer.current) window.clearTimeout(animTimer.current) }, [])
  useEffect(() => { setQ(1); busyRef.current = false; setBusy(false); setAnim(null) }, [p?.id])
  const sauces = p ? products.filter(x => x.cat === 'sous' && x.id !== p.id && x.active !== false) : []
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  const sale = p ? p.sale_active && (p.old_price ?? 0) > p.price : false
  const salePct = p && sale ? (p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)) : 0
  const wtxt = p ? (p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')) : ''
  // Oziqlik: faqat mavjud qiymatlar, "КБЖУ" sarlavhasiz ixcham qator
  const nutrition = p
    ? ([[t.nKcal, p.kcal, ''], [t.nProt, p.protein, 'g'], [t.nFat, p.fat, 'g'], [t.nCarb, p.carbs, 'g']] as const)
      .filter(([, v]) => v != null && (v as number) > 0)
    : []
  // Tavsiyalar: faqat real katalog, bir xil kategoriya; hech narsa avtomatik qo'shilmaydi
  const reco = p ? products.filter(x => x.cat === p.cat && x.id !== p.id && x.active !== false).slice(0, 6) : []
  const addToCart = (el?: HTMLElement | null) => {
    if (!p || busyRef.current) return
    busyRef.current = true
    setBusy(true); add(p.id, q); haptic('medium')
    const res = beginAddToCartAnim(el)
    if (res) {
      setAnim(res.k)
      if (animTimer.current) window.clearTimeout(animTimer.current)
      animTimer.current = window.setTimeout(() => setAnim(null), 810)
    }
    window.setTimeout(() => { busyRef.current = false; setBusy(false) }, 350)
  }
  return { lang, t, add, setQty, openP, q, setQ, busy, addToCart, anim, sauces, qtyOf, sale, salePct, wtxt, nutrition, reco }
}

/* Tavsifda menyu ma'lumotidan kelgan literal \n qoldiqlarini haqiqiy qatorboshiga aylantirish */
function cleanDesc(s: string): string {
  return s.replace(/\\n/g, '\n')
}

/* ixcham oziqlik: qiymatlar bir qatorda, birlik va "100 g uchun" ma'nosi saqlanadi;
   bo'sh bo'lsa umuman chiqmaydi, mavjud bo'lmagan qiymat ixtiro qilinmaydi.
   "КБЖУ" sarlavhasi yo'q — faqat o'lchov izohi va o'qiladigan qiymatlar. */
export function NutritionPanel({ items, per100, className }: {
  items: ReadonlyArray<readonly [string, number | null | undefined, string]>; per100: string; className?: string
}) {
  if (!items.length) return null
  return (
    <div className={className}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--mut2)]">{per100}</div>
      <div className="mt-1.5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
        {items.map(([l, v, u]) => (
          <span key={l} className="text-[13px] leading-snug whitespace-nowrap">
            <span className="font-semibold text-[var(--mut2)]">{l}</span>{' '}
            <span className="font-extrabold text-[var(--ink)] tabular-nums">{v}</span>
            {u ? <span className="font-bold text-[var(--mut2)]"> {u}</span> : null}
          </span>
        ))}
      </div>
    </div>
  )
}

/* ---------- KBJU blok: 4 ta teng plitka bir qatorda (juda tor ekranda 2x2).
   Har bir plitka: mayda, kulrang yorliq + qalin qiymat birligi bilan.
   Qiymati yo'q plitka umuman chiqmaydi (hook allaqachon filtrlaydi),
   hammasi bo'lmasa butun blok chiqmaydi. ---------- */
export function NutritionFacts({ items, per100, className }: {
  items: ReadonlyArray<readonly [string, number | null | undefined, string]>; per100: string; className?: string
}) {
  if (!items.length) return null
  return (
    <div className={className}>
      <div className="text-[11px] font-extrabold uppercase tracking-[0.08em] text-[var(--mut2)]">{per100}</div>
      <div className="mt-2 grid grid-cols-4 gap-1.5 max-[380px]:grid-cols-2">
        {items.map(([l, v, u]) => (
          <div key={l} className="min-w-0 rounded-xl bg-[var(--soft)] border border-[var(--line2)] px-2 py-2 text-center">
            <div className="text-[10px] font-bold text-[var(--mut2)] leading-tight truncate">{l}</div>
            <div className="mt-1 text-[14px] font-extrabold text-[var(--ink)] tabular-nums leading-none whitespace-nowrap">
              {v}{u ? <span className="text-[10px] font-bold text-[var(--mut2)]"> {u}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ---------- mahsulot rasmi: yuklanish skeleti (shimmer), lazy yuklash,
   xatolikda idish belgisi — modal hech qachon "bo'sh oyna" ko'rinmaydi ---------- */
export function ProductImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)
  const refCb = (el: HTMLImageElement | null) => {
    if (el && el.complete && el.naturalWidth > 0) setLoaded(true)
  }
  return (
    <>
      {!loaded && !failed && !!src && <div aria-hidden="true" className="skel absolute inset-0 !rounded-none" />}
      {(failed || !src)
        ? <div className="absolute inset-0 grid place-items-center text-[var(--mut2)]"><IcPlate /></div>
        : <img ref={refCb} src={src} alt={alt} loading="lazy" decoding="async"
            onLoad={() => setLoaded(true)} onError={() => setFailed(true)}
            className={"absolute inset-0 w-full h-full object-cover motion-safe:transition-opacity duration-300 " + (loaded ? "opacity-100" : "opacity-0")} />}
    </>
  )
}

/* ---------- tavsif: avval 3 qator, "Batafsil" bilan ochiladi ("Yopish" yig'adi).
   To'liq tarkib asosiy amallarni ekrandan siqib chiqarmaydi. ---------- */
export function ProductDescription({ text, moreLabel, lessLabel, className }: {
  text: string; moreLabel: string; lessLabel: string; className?: string
}) {
  const [open, setOpen] = useState(false)
  const clean = (text || '').replace(/\\n/g, '\n')
  if (!clean.trim()) return null
  const long = clean.trim().length > 120
  return (
    <div className={className}>
      <p className={"text-[14px] leading-relaxed text-[var(--mut2)] font-medium whitespace-pre-line " + (open ? '' : 'line-clamp-3')}>{clean}</p>
      {long && (
        <button type="button" onClick={() => setOpen(o => !o)} aria-expanded={open}
          className="press focus-ring mt-1.5 -ml-1 px-1 py-0.5 rounded-lg text-[13px] font-extrabold text-[var(--btn)] cursor-pointer">
          {open ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  )
}

/* ---------- yakuniy narx paneli: miqdor + "Savatga qo'shish" tugmasi
   (savat ikonkasi bilan, ikki qator: yorliq + TO'LIQ jami narx — hech qachon
   qisqarmaydi). Jami narx miqdor o'zgarganda darhol o'zgaradi (narx x miqdor).
   miqdor 0 bo'lsa tugma oddiy "Yopish" amaliga aylanadi: hech narsa
   savatga qo'shilmaydi. Mobil varaq va desktop modalida bir xil. ---------- */
export function ProductPriceBar({ q, total, onInc, onDec, onAdd, onCloseEmpty, emptyLabel, label, busy, anim, min = 1, stepperSize = 'md', className }: {
  q: number; total: number; onInc: () => void; onDec: () => void
  onAdd: (el?: HTMLElement | null) => void; onCloseEmpty?: () => void
  emptyLabel?: string; label: string
  busy?: boolean; anim?: number | null; min?: number; stepperSize?: 'sm' | 'md' | 'lg'; className?: string
}) {
  if (q <= 0) {
    return (
      <div className={"flex items-center gap-3 " + (className || '')}>
        <QtyStepper size={stepperSize} q={q} min={min} onInc={onInc} onDec={onDec} />
        <button type="button" onClick={() => onCloseEmpty?.()} aria-label={emptyLabel || label}
          className="press focus-ring flex-1 min-w-0 h-[56px] rounded-2xl bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] text-[15px] font-extrabold flex items-center justify-center active:scale-[.98] transition-transform cursor-pointer">
          {emptyLabel || label}
        </button>
      </div>
    )
  }
  return (
    <div className={"flex items-center gap-3 " + (className || '')}>
      <QtyStepper size={stepperSize} q={q} min={min} onInc={onInc} onDec={onDec} />
      <button type="button" onClick={e => onAdd(e.currentTarget)} disabled={busy}
        aria-label={label + ' · ' + fmt(total) + ' UZS'}
        className={`press focus-ring flex-1 min-w-0 relative overflow-hidden h-[56px] rounded-2xl bg-[var(--brand-blue)] text-white text-[15px] font-extrabold flex items-center justify-center active:scale-[.98] transition-transform cursor-pointer disabled:opacity-60 ${anim != null ? 'tk-add-active' : ''}`}>
        {anim != null && <CartJourney k={anim} />}
        <span className="tk-add-label relative flex flex-col items-center justify-center leading-none px-2">
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <IcBag s={18} />
            <span className="text-[13.5px] font-extrabold">{label}</span>
          </span>
          <span className="mt-1 text-[16px] font-extrabold tabular-nums whitespace-nowrap">
            {fmt(total)} <span className="text-[11px] font-bold opacity-70">UZS</span>
          </span>
        </span>
      </button>
    </div>
  )
}

/* sous qo'shish: ROSTYXAT — har bir sous alohida qator: rasm, nom, narx,
   sonli tugma (− son +). Barcha souslar to'liq ko'rinadi (ichki skroll yo'q). */
function SaucePicker({ sauces, qtyOf, setQty, onShow }: {
  sauces: Product[]; qtyOf: (sid: string) => number; setQty: (id: string, q: number) => void; onShow?: (p: Product) => void
}) {
  const { lang, t } = useStore()
  if (!sauces.length) return null
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[13.5px] font-extrabold text-[var(--ink)]">
        <span className="text-[var(--acc)]"><IcSauce s={15} /></span> {t.sAddSauces}
      </div>
      <div className="mt-2.5 flex flex-col gap-1">
        {sauces.map(sa => {
          const sq = qtyOf(sa.id)
          return (
            <div key={sa.id}
              className={'flex items-center gap-2.5 rounded-2xl bg-[var(--panel)] border py-1 pl-1.5 pr-1.5 ' + (sq > 0 ? 'border-[var(--chip-on)] shadow-[0_4px_12px_-4px_rgba(0,0,0,.3)]' : 'border-[var(--line2)]')}>
              <button onClick={() => { haptic(); onShow?.(sa) }} className="press flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer active:opacity-80 transition-opacity">
                <img src={pImg(sa) || undefined} alt={pName(sa, lang)} loading="lazy" className="w-10 h-10 rounded-full object-cover bg-navy-soft shrink-0" />
                <span className="min-w-0">
                  <span className="block text-[13px] font-extrabold leading-tight truncate">{pName(sa, lang)}</span>
                  <span className="block text-[11px] font-bold text-[var(--mut2)] mt-0.5 leading-none">{fmt(sa.price)} <span className="text-[9.5px]">UZS</span></span>
                </span>
              </button>
              {sq > 0 ? (
                <span className="flex items-center gap-1 shrink-0">
                  <button onClick={() => { setQty(sa.id, sq - 1); haptic() }} aria-label="minus"
                    className="press w-8 h-8 rounded-full bg-[var(--soft)] border border-[var(--line2)] text-[var(--ink)] grid place-items-center active:scale-90 transition-transform cursor-pointer">
                    <IcMinus s={14} />
                  </button>
                  <span className="min-w-[18px] text-center text-[13.5px] font-extrabold tabular-nums">{sq}</span>
                  <button onClick={() => { setQty(sa.id, sq + 1); haptic() }} aria-label="plus"
                    className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform cursor-pointer">
                    <IcPlus s={14} />
                  </button>
                </span>
              ) : (
                <button onClick={() => { setQty(sa.id, 1); haptic('light') }} aria-label="add"
                  className="press w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform cursor-pointer shrink-0">
                  <IcPlus s={14} />
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* tavsiyalar: bir xil kategoriyadagi real mahsulotlar; bosilganda shu modal almashadi (ustma-ust emas) */
function RecoRow({ items, compact, onShow, qtyOf, setSel }: { items: Product[]; compact?: boolean; onShow?: (p: Product) => void; qtyOf?: (id: string) => number; setSel?: (id: string, q: number) => void }) {
  const { lang, t, openP, add } = useStore()
  if (!items.length) return null
  /* Bosilganda asosiy mahsulot ALMASHTIRILMAYDI: kichik tafsilot popapi.
     Plus belgisi esa darhol savatga qo'shadi. */
  const card = (r: Product, wide?: string) => (
    <div key={r.id} className={`shrink-0 snap-start relative ${wide || ''}`}>
      <button onClick={() => { haptic(); (onShow || openP)(r) }} className="block w-full text-left cursor-pointer">
        <div className="aspect-square rounded-[12px] overflow-hidden bg-navy-soft">
          <img src={pImg(r) || undefined} alt={pName(r, lang)} loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="mt-1.5 text-[13px] font-bold leading-tight truncate">{pName(r, lang)}</div>
        <div className="mt-0.5 text-[12.5px] font-extrabold text-[var(--ink)] whitespace-nowrap">{fmt(r.price)} <span className="text-[10.5px] font-bold text-[var(--mut2)]">UZS</span></div>
      </button>
      {qtyOf && setSel && (qtyOf(r.id) || 0) > 0 ? (
        <span className="absolute top-2 right-2 flex items-center rounded-full bg-[var(--btn)] text-[var(--btn-ink)] shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] overflow-hidden">
          <button aria-label="minus" onClick={e => { e.stopPropagation(); setSel(r.id, (qtyOf(r.id) || 0) - 1); haptic() }} className="press w-7 h-8 grid place-items-center active:scale-90 transition-transform cursor-pointer"><IcMinus s={13} /></button>
          <span className="min-w-[16px] text-center text-[13px] font-extrabold tabular-nums">{qtyOf(r.id)}</span>
          <button aria-label="plus" onClick={e => { e.stopPropagation(); setSel(r.id, (qtyOf(r.id) || 0) + 1); haptic() }} className="press w-7 h-8 grid place-items-center active:scale-90 transition-transform cursor-pointer"><IcPlus s={13} /></button>
        </span>
      ) : (
        <button aria-label="add" onClick={e => { e.stopPropagation(); if (qtyOf && setSel) { setSel(r.id, 1); haptic('medium') } else { add(r.id); haptic('medium') } }}
          className="press absolute top-2 right-2 w-8 h-8 rounded-full bg-[var(--btn)] text-[var(--btn-ink)] grid place-items-center shadow-[0_3px_8px_-3px_rgba(0,0,0,.35)] active:scale-90 transition-transform">
          <IcPlus s={15} />
        </button>
      )}
    </div>
  )
  return (
    <div>
      <div className="text-[13.5px] font-extrabold text-[var(--ink)]">{t.recoTitle}</div>
      {compact
        ? <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">{items.map(r => card(r, 'w-[148px]'))}</div>
        : <div className="mt-2.5 grid grid-cols-3 gap-3">{items.slice(0, 3).map(r => card(r))}</div>}
    </div>
  )
}

/* ---------- kichik tafsilot popapi: sous/qo'shimcha/tavsiya bosilganda
   tafsilotlari ko'rsatiladi. Asosiy modal ALMASHTIRILMAYDI. Telegram
   BackButton avval shu popapni yopadi (miniCloseRef orqali). ---------- */
let miniCloseRef: (() => void) | null = null
function MiniProduct({ p, onClose, onAddSel }: { p: Product; onClose: () => void; onAddSel?: (q: number) => void }) {
  const { lang, t, add } = useStore()
  const [q, setQ] = useState(1)
  useEffect(() => {
    miniCloseRef = onClose
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.stopPropagation(); onClose() } }
    document.addEventListener('keydown', onKey, true)
    return () => { miniCloseRef = null; document.removeEventListener('keydown', onKey, true) }
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-[60]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/45" />
      <div className="absolute inset-0 grid place-items-center p-4 pointer-events-none">
        <div onClick={e => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={pName(p, lang)}
          className="anim-modal pointer-events-auto w-[min(320px,88vw)] bg-[var(--sheet)] rounded-[22px] overflow-hidden shadow-[0_30px_80px_rgba(4,10,40,.5)]">
          <div className="relative aspect-[16/10] bg-navy-soft shrink-0">
            <ImgOrPlate src={pImg(p)} alt={pName(p, lang)} />
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="text-[17px] font-extrabold leading-tight">{pName(p, lang)}</div>
              <div className="text-[16px] font-extrabold whitespace-nowrap tracking-tight">{fmt(p.price)}<span className="text-[10.5px] text-[var(--mut2)] font-bold"> UZS</span></div>
            </div>
            {pDesc(p, lang) && <p className="mt-2 text-[13px] leading-relaxed text-[var(--mut2)] font-medium line-clamp-3 whitespace-pre-line">{cleanDesc(pDesc(p, lang))}</p>}
            {onAddSel ? (
              <button onClick={() => { onAddSel(1); haptic('medium'); onClose() }}
                className="press mt-3.5 w-full py-3 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[14.5px] font-extrabold active:scale-[.98] transition-transform">{t.addCart}</button>
            ) : (
              <div className="mt-3.5 flex items-center gap-2.5">
                <QtyStepper q={q} min={1} onInc={() => { setQ(v => v + 1); haptic() }} onDec={() => { if (q > 1) { setQ(v => v - 1); haptic() } }} />
                <button onClick={() => { add(p.id, q); haptic('medium'); onClose() }}
                  className="press flex-1 py-3 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[14.5px] font-extrabold active:scale-[.98] transition-transform">{t.addCart}</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- mahsulot modali: katalog, savat va sahifadan ochiladigan yagona modal ---------- */
export function ProductSheet() {
  const { sheetP, closeP } = useStore()
  const isDesktop = useIsDesktop()
  if (!sheetP) return null
  if (isDesktop) return <DesktopProduct p={sheetP} onClose={closeP} />
  return <ProductSheetMobile p={sheetP} onClose={closeP} />
}

/* ---------- desktop mahsulot moduli (>=1024px): bitta ustun — rasm, nom,
   KBJU, tavsif ("Batafsil" bilan). Souslar va tavsiyalar modalda KO'RINMAYDI
   (SaucePicker / RecoRow komponentlari saqlanadi — savat sahifasi uchun).
   Tashqi o'lchamlar barqaror: balandlik kontentga emas, ko'rish oynasiga
   bog'liq; buyurtma paneli pastda biriktirilgan, kontent yuqorida aylanadi. ---------- */
function DesktopProduct({ p, onClose }: { p: Product; onClose: () => void }) {
  const m = useProductModal(p)
  const [enter, setEnter] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { const id = window.setTimeout(() => setEnter(true), 10); return () => clearTimeout(id) }, [])
  useEffect(() => {
    const docEl = document.documentElement
    const unlock = lockPageScroll()
    const prevPad = document.body.style.paddingRight
    const prevScrollY = window.scrollY
    const prevFocus = document.activeElement as HTMLElement | null
    // Windows'da skrollbarga yo'qolishidan keladigan siljishni qoplaymiz
    if (window.innerWidth > docEl.clientWidth) {
      document.body.style.paddingRight = `${window.innerWidth - docEl.clientWidth}px`
    }
        requestAnimationFrame(() => panelRef.current?.focus())
    const onKey = (e: KeyboardEvent) => {
      if (!panelRef.current) return
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return }
      if (e.key !== 'Tab') return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(x => !x.hasAttribute('disabled') && x.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      unlock()
      document.body.style.paddingRight = prevPad
      if (Math.abs(window.scrollY - prevScrollY) > 2) window.scrollTo(0, prevScrollY)
      try { prevFocus?.focus?.() } catch {}
    }
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${enter ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-6 pointer-events-none">
        <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={pName(p, m.lang)}
          className={`pointer-events-auto relative w-[min(420px,94vw)] h-[min(86vh,680px)] flex flex-col outline-none rounded-[26px] bg-[var(--sheet)] shadow-[0_40px_120px_rgba(4,10,40,.55)] overflow-hidden transition-[opacity,transform] duration-300 ${enter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-2'}`}>
          <button onClick={onClose} aria-label={m.t.closeBtn}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[var(--panel)] border border-[var(--line2)] grid place-items-center text-[var(--mut2)] hover:text-[var(--ink)] hover:bg-navy-soft active:scale-90 transition-all cursor-pointer">
            <IcX s={16} />
          </button>
          {/* yagona skroll hudud: rasm → nom → KBJU → tavsif */}
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain">
            <div className="w-full max-w-[420px] mx-auto px-6 pt-7 pb-6">
              <div className="relative aspect-square rounded-[18px] overflow-hidden bg-navy-soft shrink-0">
                <ProductImage src={pImg(p)} alt={pName(p, m.lang)} />
                {m.sale && (
                  <span className="absolute top-3 left-3 bg-[var(--promo)] text-[var(--promo-ink)] text-[12px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-[9px]">
                    −{m.salePct}%
                  </span>
                )}
                {m.wtxt && <span className="absolute bottom-3 left-3 bg-black/45 text-white text-[12px] font-bold px-2.5 py-1.5 rounded-[9px]">{m.wtxt}</span>}
              </div>
              <div className="mt-4 flex items-center gap-2">
                <div className="text-[22px] font-extrabold leading-tight">{pName(p, m.lang)}</div>
                {isSpicy(p) && <SpicyBadge size={20} />}
              </div>
              <NutritionFacts className="mt-3.5" items={m.nutrition} per100={m.t.per100} />
              <ProductDescription className="mt-3.5" text={cleanDesc(pDesc(p, m.lang) || '')} moreLabel={m.t.moreBtn} lessLabel={m.t.lessBtn} />
            </div>
          </div>
          {/* buyurtma paneli biriktirilgan: miqdor + jami narx */}
          <div className="px-6 py-4 border-t border-[var(--line)] bg-[var(--sheet)]">
            <ProductPriceBar
              q={m.q} total={p.price * m.q} min={0} stepperSize="lg"
              onInc={() => { m.setQ(v => v + 1); haptic() }}
              onDec={() => { if (m.q > 0) { m.setQ(v => v - 1); haptic() } }}
              onAdd={(el) => { if (m.q > 0) { m.addToCart(el); window.setTimeout(() => onClose(), 560) } }}
              onCloseEmpty={onClose} emptyLabel={m.t.closeBtn}
              label={m.t.addCart} busy={m.busy} anim={m.anim}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- rasm: yuklanmasa yoki bo'lmasa — plitka fon va idish belgisi,
   modal hech qachon "bo'sh oyna" ko'rinmaydi ---------- */
function ImgOrPlate({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false)
  return (
    <>
      {(failed || !src)
        ? <div className="absolute inset-0 grid place-items-center text-[var(--mut2)]"><IcPlate /></div>
        : <img src={src} alt={alt} onError={() => setFailed(true)} className="absolute inset-0 w-full h-full object-cover" />}
    </>
  )
}

/* ---------- mobil mahsulot modali (<1024px): to'liq balandlikdagi varaq.
   Tarkibi qisqartirildi — faqat: rasm (badge bilan) → nom → KBJU → tavsif
   ("Batafsil"/"Yopish"). Souslar va tavsiyalar modalda KO'RINMAYDI
   (SaucePicker / RecoRow komponentlari saqlanadi, savat sahifasi uchun
   qayta ishlatiladi). Buyurtma paneli PASTDA BIRIKTIRILGAN: skroll qancha
   bo'lsa ham miqdor + "Savatga qo'shish · jami narx" doim ko'rinadi.
   Varaq TO'LIQ EKRAN EMAS: pastga biriktirilgan bottom sheet — balandligi
   kontentga bog'liq, lekin 100dvh - --sat - 28px dan oshmaydi, shuning uchun
   tepada doim xira zona qoladi va Telegramning Back/v/… tugmalari hech qachon
   varaq ustiga tushmaydi. Sudrash dastagi varaqaning tashqarisida, uning
   tepasida turadi va harakat yo'nalishiga qarab "v"/"^" bo'lib bukiladi. ---------- */
/* Dastakning dam holati: yengil egri chiziq (namunadagi uslub). Sudrashda
   bu qiymatdan kattaroq bukiladi. bend darajasi -> SVG cho'kishiga (px). */
const REST_BEND = 6
const handleSag = (bend: number) => Math.max(-8, Math.min(8, bend * 0.6))

function ProductSheetMobile({ p, onClose }: { p: Product; onClose: () => void }) {
  const m = useProductModal(p)
  const [enter, setEnter] = useState(false)
  const [closing, setClosing] = useState(false)
  const [dy, setDy] = useState(0)
  const [drag, setDrag] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  /* Sudrash dastagining "chevron" holati (daraja): 0 = tekis, musbat =
     o'rtasi PASTGA bukilgan (sudrab yopish/yopilish), manfiy = TEPAGA
     bukilgan (ochilish va orqaga qaytish). prefers-reduced-motion: doim tekis. */
  const [bend, setBend] = useState(REST_BEND)
  const bendRef = useRef(REST_BEND)
  const bendRaf = useRef(0)
  /* bend ni silliq o'tkazish: SVG 'd' CSS transition qilmaydi, shuning uchun
     qisqa rAF tween (240ms, easeOutCubic). Sudrashda esa to'g'ridan-to'g'ri. */
  const bendTo = (to: number, ms = 240) => {
    window.cancelAnimationFrame(bendRaf.current)
    if (reducedMotion.current) { bendRef.current = to; setBend(to); return }
    const from = bendRef.current
    const t0 = performance.now()
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      const v = from + (to - from) * e
      bendRef.current = v
      setBend(v)
      if (k < 1) bendRaf.current = window.requestAnimationFrame(step)
    }
    bendRaf.current = window.requestAnimationFrame(step)
  }
  const bendSet = (v: number) => {
    window.cancelAnimationFrame(bendRaf.current)
    bendRef.current = v
    setBend(v)
  }
  const reducedMotion = useRef(false)
  /* Yopish: popap pastga silliq sirg'alib chiqadi (chiroyli exit), keyin o'chiriladi */
  const closingRef = useRef(false)
  const doClose = () => {
    if (closingRef.current) return
    closingRef.current = true
    if (!reducedMotion.current) bendTo(16, 200)
    setDrag(false); setDy(0); setClosing(true)
    window.setTimeout(onClose, 340)
  }
  /* Telegram qo'llanmasi: popapni X bilan emas, BackButton bilan yopish.
     Brauzerda avvalgi ko'rinish (X) saqlanadi. */
  const inTg = !!TGA?.BackButton?.show
  const nav = useNavigate()
  const loc = useLocation()
  const closeRef = useRef<() => void>(doClose)
  closeRef.current = doClose
  useEffect(() => {
    const bb = TGA?.BackButton
    if (!bb?.show) return
    const go = () => { if (miniCloseRef) { miniCloseRef(); return } closeRef.current() }
    try { bb.onClick(go); bb.show() } catch {}
    return () => {
      try { bb.offClick?.(go); bb.hide() } catch {}
      if (!TAB_PATHS.includes(loc.pathname)) { try { bb.show() } catch {} }
    }
  }, [loc.pathname])
  useEffect(() => { reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches }, [])
  useEffect(() => {
    // ochilish animatsiyasida dastak o'rtasi TEPAGA bukiladi, keyin tekislanadi
    if (reducedMotion.current) return
    bendSet(-14)
    const t = window.setTimeout(() => bendTo(REST_BEND), 520)
    return () => { window.clearTimeout(t); window.cancelAnimationFrame(bendRaf.current) }
  }, [])
  useEffect(() => { const id = window.setTimeout(() => setEnter(true), 16); return () => window.clearTimeout(id) }, [])
  /* Kontent eng tepasida yana pastga surilsa — popap yopiladi */
  const sw = useRef<{ y0: number; engaged: boolean } | null>(null)
  const sDown = (e: React.TouchEvent) => { sw.current = { y0: e.touches[0].clientY, engaged: false } }
  const sMove = (e: React.TouchEvent) => {
    const st = sw.current
    if (!st || closingRef.current) return
    const dyv = e.touches[0].clientY - st.y0
    const el = scrollRef.current
    if (!st.engaged && dyv > 8 && el && el.scrollTop <= 0) { st.engaged = true; setDrag(true) }
    if (st.engaged) {
      const v = Math.max(0, dyv - 8)
      setDy(v)
      if (!reducedMotion.current) bendSet(Math.min(16, v / 7))
    }
  }
  const sEnd = () => {
    const st = sw.current
    sw.current = null
    if (!st || !st.engaged) return
    setDrag(false)
    if (dy > 110) { doClose(); return }
    setDy(0)
    // yopilmadi: varaq orqaga ko'tariladi — dastak TEPAGA bukiladi, keyin dam holatiga qaytadi
    if (!reducedMotion.current) { bendSet(-10); window.setTimeout(() => bendTo(REST_BEND), 260) }
  }
  /* Sarlavha zonasidan pastga sudrab yopish */
  const down = useRef<{ y: number } | null>(null)
  const onDown = (e: React.TouchEvent) => { down.current = { y: e.touches[0].clientY }; setDrag(true) }
  const onMove = (e: React.TouchEvent) => {
    if (!down.current || closingRef.current) return
    const d = e.touches[0].clientY - down.current.y
    if (d > 0) {
      setDy(d)
      if (!reducedMotion.current) bendSet(Math.min(16, d / 7))
    }
  }
  const onEnd = (e: React.TouchEvent) => {
    if (!down.current) return
    const d0 = down.current; down.current = null
    const d = e.changedTouches[0].clientY - d0.y
    setDrag(false)
    if (d > 110) { doClose(); return }
    setDy(0)
    if (!reducedMotion.current) { bendSet(-10); window.setTimeout(() => bendTo(REST_BEND), 260) }
  }
  const bgDown = useRef<{ x: number; y: number } | null>(null)
  /* Popap qaysi sahifada ochilgani: yopilganda skrollni faqat shu sahifada qaytaramiz */
  const mountPathRef = useRef<string>('')
  useEffect(() => {
    mountPathRef.current = loc.pathname
    const unlock = lockPageScroll()
    const prevScrollY = window.scrollY
    const prevFocus = document.activeElement as HTMLElement | null
        const onKey = (e: KeyboardEvent) => {
      if (!panelRef.current) return
      if (e.key === 'Escape') { e.stopPropagation(); closeRef.current(); return }
      if (e.key !== 'Tab') return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )).filter(x => !x.hasAttribute('disabled') && x.offsetParent !== null)
      if (!items.length) return
      const firstEl = items[0]
      const lastEl = items[items.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      unlock()
      // Popap ochilgan sahifada qaytsak, skroll eski joyiga qaytadi; boshqa sahifaga o'tilgan bo'lsa tegmaymiz
      if (Math.abs(window.scrollY - prevScrollY) > 2 && (!mountPathRef.current || window.location.pathname === mountPathRef.current)) window.scrollTo(0, prevScrollY)
      try { prevFocus?.focus?.() } catch {}
    }
  }, [])
  /* Savatga qo'shish: faqat asosiy mahsulot (shu modaldagi miqdor bilan,
     kamida 1). Javob animatsiyasidan keyin modal yopiladi. Menyudan boshqa
     sahifadan ochilgan bo'lsa menyuga qaytib, kartochkani ko'rsatamiz. */
  const onAdd = (el?: HTMLElement | null) => {
    if (m.busy || m.q <= 0) return
    m.addToCart(el)
    window.setTimeout(() => {
      if (mountPathRef.current !== '/') {
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
        nav('/')
        window.setTimeout(() => {
          const el2 = document.querySelector<HTMLElement>(`[data-pc="${p.id}"]`)
          if (el2) el2.scrollIntoView({ block: 'center', behavior: reduced ? 'auto' : 'smooth' })
        }, 420)
      }
      doClose()
    }, 560)
  }
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div
        onPointerDown={e => { bgDown.current = { x: e.clientX, y: e.clientY } }}
        onClick={e => {
          const d = bgDown.current; bgDown.current = null
          if (d && Math.hypot(e.clientX - d.x, e.clientY - d.y) > 14) return
          doClose()
        }}
        className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${enter && !closing ? 'opacity-100' : 'opacity-0'}`}
        style={{ pointerEvents: enter && !closing ? undefined : 'none' }}
      />
      {/* Varaq va dastak BIRGA tarjima qilinadi (translateY): dastak varaqaning
          YuQORISIDA, xira fon ustida turadi. Balandlik kontentga bog'liq, lekin
          tk-sheet-cap (100dvh - --sat - 28px) bilan cheklanadi — tepada doim
          xira zona qoladi, Telegram Back/v/… tugmalari varaq ustiga tushmaydi. */}
      <div className="absolute inset-x-0 bottom-0"
        style={{
          transform: `translateY(${closing || !enter ? '100%' : `${dy}px`})`,
          transition: drag ? 'none' : 'transform .42s cubic-bezier(.32,.72,0,1)',
        }}>
        {/* sudrash dastagi: ikkita bo'lakcha TASHQI uchidan aylanadi — Safari
            SVG 'd' atributini animatsiya qilmaydi, shuning uchun shu usul.
            Tekis holatda chiziq; pastga sudranda "v", ochilishda/orqaga
            qaytganda "^"; 240ms ichida silliq o'tadi. */}
        <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
          style={{ touchAction: 'none' }}
          className="absolute bottom-full left-1/2 z-10 h-11 w-16 -translate-x-1/2 flex flex-col items-center justify-end pb-1 cursor-grab active:cursor-grabbing">
          <span className="relative block h-[16px] w-[38px]" aria-hidden="true">
            {/* BITTA butun egri chiziq (bitta SVG yo'lak, bo'laklarsiz):
                bend — egilish darajasi. Musbat: o'rtasi pastga bukiladi ("v"),
                manfiy: tepaga ("^"). Sag' (cho'kish) ±8px oralig'ida. */}
            <svg width="38" height="16" viewBox="0 0 38 16" fill="none" aria-hidden="true">
              <path d={`M 2.5 7 Q 19 ${7 + handleSag(bend)} 35.5 7`}
                stroke="rgba(255,255,255,.92)" strokeWidth="5" strokeLinecap="round" />
            </svg>
          </span>
        </div>
        <div ref={panelRef} role="dialog" aria-modal="true" aria-label={pName(p, m.lang)}
          className="tk-sheet-cap tk-sheet-vh relative flex flex-col bg-[var(--sheet)] rounded-t-[22px] shadow-[0_-20px_60px_rgba(10,15,50,.25)] overscroll-contain select-none">
          {/* tepa: sudrab yopish zonasi (ko'rinadigan dastak varaqaning ustida) */}
          <div onTouchStart={onDown} onTouchMove={onMove} onTouchEnd={onEnd} onTouchCancel={onEnd}
            style={{ touchAction: 'none' }}
            className={`relative shrink-0 cursor-grab active:cursor-grabbing ${inTg ? 'h-6' : 'h-11'}`}>
            {/* Telegramda X yoq: yopish BackButton va pastga surish orqali */}
            {!inTg && (
              <button onClick={doClose} aria-label={m.t.closeBtn}
                className="press absolute right-4 top-1 w-9 h-9 rounded-full bg-[var(--panel)] border border-[var(--line2)] grid place-items-center text-[var(--mut2)] active:scale-90 transition-transform shrink-0">
                <IcX s={16} />
              </button>
            )}
          </div>
        {/* yagona skroll hudud: rasm → nom → KBJU → tavsif */}
        <div ref={scrollRef} onTouchStart={sDown} onTouchMove={sMove} onTouchEnd={sEnd} onTouchCancel={sEnd} className="min-h-0 overflow-y-auto no-scrollbar px-5 pt-1 pb-5 overscroll-contain">
          <div className="relative aspect-square rounded-[20px] overflow-hidden bg-navy-soft shrink-0">
            <ProductImage src={pImg(p)} alt={pName(p, m.lang)} />
            {m.sale && (
              <span className="absolute top-2.5 left-2.5 bg-[var(--promo)] text-[var(--promo-ink)] text-[11.5px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-[9px]">
                −{m.salePct}%
              </span>
            )}
            {m.wtxt && <span className="absolute bottom-2.5 left-3 bg-black/45 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg">{m.wtxt}</span>}
          </div>
          <div className="mt-3.5 flex items-center gap-2">
            <div className="text-[21px] font-extrabold leading-tight">{pName(p, m.lang)}</div>
            {isSpicy(p) && <SpicyBadge size={20} />}
          </div>
          <NutritionFacts className="mt-3" items={m.nutrition} per100={m.t.per100} />
          <ProductDescription className="mt-3" text={cleanDesc(pDesc(p, m.lang) || '')} moreLabel={m.t.moreBtn} lessLabel={m.t.lessBtn} />
        </div>
          {/* biriktirilgan buyurtma paneli: miqdor + "Savatga qo'shish · jami".
              Miqdor 0 bo'lsa tugma "Yopish" bo'ladi va hech narsa qo'shilmaydi. */}
          <div style={{ paddingBottom: 'calc(12px + var(--sab))' }} className="shrink-0 bg-[var(--sheet)] border-t border-[var(--line)] px-4 pt-3">
            <ProductPriceBar
              q={m.q} total={p.price * m.q} min={0}
              onInc={() => { m.setQ(v => v + 1); haptic() }}
              onDec={() => { if (m.q > 0) { m.setQ(v => v - 1); haptic() } }}
              onAdd={onAdd} onCloseEmpty={doClose} emptyLabel={m.t.closeBtn}
              label={m.t.addCart} busy={m.busy} anim={m.anim}
            />
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

/* ---------- savatga qo'shish: yagona chapdan-o'ngga savat yo'nalishi.
   Tugma ichida (overflow-hidden), ikonka loyihaning IcBag svg'si, rangi
   currentColor — chegirmali (orange) tugmada ham ikkala temada o'qiladi.
   Masofa --tk-jw orqali real tugma kengligiga moslanadi (LayoutAssets yo'q:
   bitta o'lchov, transform harakati). ---------- */
export function CartJourney({ k }: { k: number }) {
  const ref = useRef<HTMLSpanElement | null>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const btn = el.parentElement as HTMLElement | null
    const w = btn ? Math.max(0, btn.clientWidth - 8) : 0
    el.style.setProperty('--tk-jw', `${w}px`)
  }, [])
  return (
    <span key={k} ref={ref} aria-hidden="true" className="tk-journey">
      <span className="tk-j-cart"><IcBag s={18} /></span>
    </span>
  )
}

/* ---------- savat soni oshganda ikonka va nishon nozik urib qoladi
   (muvaffaqiyatli qo'shishdan keyin; kamayishda jim turadi) ---------- */
function useCartBeat() {
  const { cartCount } = useStore()
  const [beat, setBeat] = useState(0)
  const prev = useRef(cartCount)
  useEffect(() => {
    if (cartCount > prev.current) setBeat(b => b + 1)
    prev.current = cartCount
  }, [cartCount])
  return beat
}

/* ---------- suzuvchi savat tugmasi: App.dagi floating-row ichida ---------- */
/* ---------- Desktop savat paneli holati (lg+): FloatingCart ochadi,
   sahifa yo'nalishi o'zgarganda, overlay/Escape/BackButton bosilganda yopiladi. ---------- */
let cartPanelOpen = false
const cartPanelSubs = new Set<() => void>()
export function setCartPanelOpen(v: boolean) {
  if (v === cartPanelOpen) return
  cartPanelOpen = v
  cartPanelSubs.forEach(f => f())
}
export function useCartPanelOpen() {
  return React.useSyncExternalStore(
    (cb) => { cartPanelSubs.add(cb); return () => { cartPanelSubs.delete(cb) } },
    () => cartPanelOpen,
  )
}

/* ---------- Desktop buyurtmalar paneli holati (lg+): headerdagi
   "Buyurtmalar" tugmasi ochadi; overlay/Escape/BackButton bosilganda yopiladi. ---------- */
let ordersPanelOpen = false
const ordersPanelSubs = new Set<() => void>()
export function setOrdersPanelOpen(v: boolean) {
  if (v === ordersPanelOpen) return
  ordersPanelOpen = v
  ordersPanelSubs.forEach(f => f())
}
export function useOrdersPanelOpen() {
  return React.useSyncExternalStore(
    (cb) => { ordersPanelSubs.add(cb); return () => { ordersPanelSubs.delete(cb) } },
    () => ordersPanelOpen,
  )
}

/* ---------- Desktop profil paneli holati (lg+): headerdagi "Profil" tugmasi ochadi;
   overlay/Escape/BackButton bosilganda yopiladi. ---------- */
let profilePanelOpen = false
const profilePanelSubs = new Set<() => void>()
export function setProfilePanelOpen(v: boolean) {
  if (v === profilePanelOpen) return
  profilePanelOpen = v
  profilePanelSubs.forEach(f => f())
}
export function useProfilePanelOpen() {
  return React.useSyncExternalStore(
    (cb) => { profilePanelSubs.add(cb); return () => { profilePanelSubs.delete(cb) } },
    () => profilePanelOpen,
  )
}

export function FloatingCart() {
  const { cartCount, t } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const beat = useCartBeat()
  const isWide = useIsWide()
  if (loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  return (
    <button onClick={() => { haptic(); if (isWide) { setOrdersPanelOpen(false); setProfilePanelOpen(false); setCartPanelOpen(true) } else nav('/cart') }} aria-label="cart"
      className="floating-quick relative w-[var(--float-size)] h-[var(--float-size)] shrink-0 rounded-[18px] tk-float-cart grid place-items-center cursor-pointer">
      <span role="status" className="sr-only">{t.cartLive.replace('{n}', String(cartCount))}</span>
      <span key={beat} className={`grid place-items-center ${beat ? 'cart-beat' : ''}`}><IcBag s={26} /></span>
      {cartCount > 0 && (
        <span key={'b' + beat} className={`absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-[#E8462B] text-white text-[11px] font-extrabold grid place-items-center leading-none border-2 border-[var(--bg)] ${beat ? 'cart-beat' : ''}`}>{cartCount}</span>
      )}
    </button>
  )
}

/* ---------- yuqoriga chiqish: qator ichida, o'lchovi qolganlari bilan bir xil.
   Yashir holatda ham joy saqlanadi — qator qolgan tugmalar siljinmaydi. ---------- */
export function ScrollTop() {
  const [show, setShow] = useState(false)
  const loc = useLocation()
  useEffect(() => {
    const fn = () => setShow(window.scrollY > 480)
    window.addEventListener('scroll', fn, { passive: true })
    fn()
    return () => window.removeEventListener('scroll', fn)
  }, [loc.pathname])
  if (loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  if (!show) return <span className="floating-quick w-[var(--float-size)] h-[var(--float-size)] shrink-0" aria-hidden="true" />
  return (
    <button onClick={() => {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' })
    }} aria-label="up"
      className="floating-quick press w-[var(--float-size)] h-[var(--float-size)] shrink-0 rounded-[18px] bg-white border border-black/10 text-[var(--brand-blue)] grid place-items-center shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)] hover:bg-[#F1F5F9] active:scale-95 transition-[transform,background-color] cursor-pointer">
      <IcTop s={20} />
    </button>
  )
}

/* ---------- bepul yetkazib berish: progressli tugma + modul (kgsushi uslubi) ---------- */
export function GiftProgress() {
  const { cartSum, t, deliveryCfg } = useStore()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  if (loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  const threshold = deliveryCfg?.threshold || 200000
  const left = Math.max(0, threshold - cartSum)
  const pct = Math.min(1, cartSum / threshold)
  const done = left <= 0
  const R = 25, C = 2 * Math.PI * R
  const R2 = 26, C2 = 2 * Math.PI * R2
  return (
    <>
      <div className="floating-quick relative shrink-0 group">
        {/* Desktopda hover izohi: faqat opacity/transform, layout siljinmaydi.
            Ranglar hammasi semantik tokenlardan — ikkala temada o'qiladi. */}
        <div className="hidden lg:block absolute right-full top-1/2 -translate-y-1/2 mr-2.5 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 motion-safe:transition-[opacity,transform] duration-300 pointer-events-none">
          <div className="rounded-2xl bg-[var(--sheet)] border border-[var(--line2)] shadow-[0_14px_30px_-12px_rgba(0,0,0,.45)] px-4 py-2.5">
            <div className="text-[13px] font-extrabold text-[var(--ink)] whitespace-nowrap">{done ? t.fdDone : t.fdLeft.replace('{x}', fmt(left))}</div>
            <div className="text-[11px] font-semibold text-[var(--mut2)] whitespace-nowrap mt-0.5">{done ? t.fdDoneSub : t.fdTo}</div>
          </div>
        </div>
        <button onClick={() => { haptic('light'); setOpen(true) }} aria-label="gift" className="relative w-[var(--float-size)] h-[var(--float-size)] grid place-items-center active:scale-95 transition-transform cursor-pointer">
          <svg width="56" height="56" viewBox="0 0 56 56" className="absolute inset-0 -rotate-90">
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--line2)" strokeWidth="3" />
            <circle cx="28" cy="28" r={R} fill="none" stroke="var(--promo)" strokeWidth="3" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - pct)} style={{ transition: 'stroke-dashoffset .5s cubic-bezier(.32,.72,0,1)' }} />
          </svg>
          <span className="w-[44px] h-[44px] rounded-full bg-[var(--sheet)] border border-[var(--line)] grid place-items-center shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)] transition-colors duration-300" style={{ color: done ? 'var(--promo-deep)' : 'var(--acc)' }}>
            <IcTruck s={18} />
          </span>
        </button>
      </div>
      {open && createPortal(
        <div className="fixed inset-0 z-[75] grid place-items-center px-6">
          <div className="absolute inset-0 bg-black/45 anim-fade" onClick={() => setOpen(false)} />
          <div className="relative anim-pop bg-[var(--sheet)] rounded-[26px] px-6 py-7 w-full max-w-[360px] text-center shadow-[0_30px_80px_rgba(0,0,0,.35)]">
            <button onClick={() => setOpen(false)} className="press absolute top-3 right-3 w-8 h-8 rounded-full bg-[var(--panel)] grid place-items-center text-[var(--mut2)]"><IcX /></button>
            <div className="relative w-16 h-16 mx-auto">
              <svg width="64" height="64" viewBox="0 0 64 64" className="-rotate-90">
                <circle cx="32" cy="32" r={R2} fill="none" stroke="var(--line2)" strokeWidth="5" />
                <circle cx="32" cy="32" r={R2} fill="none" stroke="var(--acc)" strokeWidth="5" strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={C2 * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.32,.72,0,1)' }} />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[var(--acc)]"><IcTruck s={24} /></span>
            </div>
            {left > 0 ? (
              <>
                <div className="mt-3 text-[17px] font-extrabold text-[var(--ink)]">{t.fdLeft.replace('{x}', fmt(left))}</div>
                <div className="mt-0.5 text-[12.5px] font-semibold text-[var(--mut2)]">{t.fdTo}</div>
              </>
            ) : (
              <>
                <div className="mt-3 text-[17px] font-extrabold text-[var(--ink)]">{t.fdDone}</div>
                <div className="mt-0.5 text-[12.5px] font-semibold text-[var(--mut2)]">{t.fdDoneSub}</div>
              </>
            )}
            <button onClick={() => setOpen(false)} className="press mt-4 w-full py-3 rounded-2xl bg-[var(--btn)] text-[var(--btn-ink)] text-[14px] font-extrabold">{t.cityOk}</button>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}
