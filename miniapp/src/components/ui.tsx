import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate, useLocation } from 'react-router-dom'
import { useStore, pName, pImg, CATS, type Product } from '../lib/store'
import { fmt } from '../lib/money'
import { pDesc } from '../lib/store'
import { haptic, useNativeBack, tgUser, currentTheme, subscribeTheme, changeTheme, type ThemeMode } from '../lib/tg'
import { AnimatedThemeToggler } from './magicui/animated-theme-toggler'
import MapPicker from './MapPicker'
import { DeliveryModal, PickupModal, InitialChoiceModal } from './Fulfillment'

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
export const IcBurger = ({ s = 18 }: { s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <rect x="1.3" y="2.9" width="13.4" height="2.1" rx="1.05" />
    <rect x="1.3" y="6.95" width="13.4" height="2.1" rx="1.05" />
    <rect x="1.3" y="11" width="13.4" height="2.1" rx="1.05" />
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



export function WhaleMark({ size = 40 }: { size?: number }) {
  return <img src="/logo.png" width={size} height={size} className="rounded-[12px]" alt="" />
}

function hiName(t: any, user: { name?: string } | null) {
  let h = 12
  try { h = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Tashkent' }).format(new Date())) } catch {}
  const g = h >= 5 && h < 12 ? t.greetMorning : h < 18 ? t.greetDay : t.greetEvening
  return `${g}, ${user?.name || tgUser()?.first_name || t.greetGuest}!`
}

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

function LangPicker({ dark }: { dark?: boolean }) {
  const { t, lang, setLang } = useStore()
  const [open, setOpen] = React.useState(false)
  return (
    <>
      <button onClick={() => setOpen(true)}
        className={`press flex items-center gap-1.5 rounded-xl px-2.5 py-2 text-[12px] font-extrabold active:scale-95 transition-transform ${dark ? 'bg-[var(--panel)] text-[var(--ink)]' : 'bg-navy-soft text-navy-ink'}`}>
        <FlagOf l={lang} s={15} />{lang.toUpperCase()}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={t.language}>
        <div className="space-y-2 pb-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic(); setOpen(false) }}
              className={`press w-full flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${lang === l ? 'bg-navy text-white border-navy shadow-[0_4px_12px_-4px_rgba(10,33,148,.4)]' : 'bg-[var(--panel)] border-navy-line'}`}>
              <FlagOf l={l} s={22} />
              <span className="text-[15px] font-extrabold flex-1">{LANG_NAME[l]}</span>
              {lang === l && <IcCheck s={18} />}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  )
}


/* ---------- mavzu almashtirish tugmasi ---------- */

export function ThemeToggle() {
  const { t } = useStore()
  const [theme, setThemeL] = useState<ThemeMode>(() => currentTheme())
  useEffect(() => subscribeTheme(setThemeL), [])
  return (
    <AnimatedThemeToggler
      theme={theme}
      onThemeChange={changeTheme}
      aria-label={t.themeLabel}
      icon={(dark) => (dark ? <IcSun s={17} /> : <IcMoon s={17} />)}
      className="focus-ring press grid place-items-center w-10 h-10 rounded-full bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)] active:scale-95 transition-colors shrink-0"
    />
  )
}

/* ---------- ichki sahifalar uchun yuqori panel (tungi) ---------- */
export function TopBar({ title, right, flat }: { title?: string; right?: React.ReactNode; back?: boolean; flat?: boolean }) {
  const { t, user } = useStore()
  useNativeBack(!!title)
  const inner = (
    <div className="bg-[var(--bg)] text-[var(--ink)] border-b border-[var(--line)]">
      <div className="max-w-[1240px] mx-auto flex items-center gap-2 px-4 lg:px-6 py-2">
        {title ? (
          <>
            <div className="text-[16px] font-extrabold flex-1 truncate">{title}</div>
          </>
        ) : (
          <>
            <WhaleMark />
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-extrabold leading-tight">{t.brand}</div>
              <div className="text-[12.5px] font-semibold text-[var(--mut2)] leading-tight truncate">{hiName(t, user)}</div>
            </div>
          </>
        )}
        {right ?? (
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <LangPicker dark />
          </div>
        )}
      </div>
    </div>
  )
  if (flat) return inner
  return <header className="sticky top-0 z-30 bg-[var(--bg)]" style={{ paddingTop: 'calc(6px + var(--sat))' }}>{inner}</header>
}

/* ---------- hamburger menyu ---------- */
export function Drawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, lang, setLang, user } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const activeCat = loc.pathname.startsWith('/cat/') ? loc.pathname.slice(5) : null
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    const prevFocus = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'
    const on = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', on)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', on)
      try { prevFocus?.focus?.() } catch {}
    }
  }, [open, onClose])
  if (!open) return null
  return createPortal(
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label={t.menuT}>
      <div className="absolute inset-0 bg-black/45 backdrop-blur-[2px] anim-fade" onClick={onClose} />
      <aside className="absolute left-0 top-0 bottom-0 w-[302px] lg:w-[340px] bg-[var(--bg2)] text-[var(--ink)] flex flex-col anim-drawer shadow-2xl"
        style={{ paddingTop: 'calc(16px + var(--sat))', paddingBottom: 'calc(16px + var(--sab))' }}>
        <div className="flex items-center justify-between px-5">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="" className="w-10 h-10 rounded-[12px]" />
            <span className="text-[15px] font-extrabold tracking-[0.08em]">TEKIT SUSHI</span>
          </div>
          <button onClick={onClose} className="press w-9 h-9 rounded-xl bg-[var(--panel)] grid place-items-center text-[var(--mut2)] active:scale-95 transition-transform"><IcX /></button>
        </div>

        <div className="px-5 mt-4 flex gap-2">
          {(['uz', 'ru', 'en'] as const).map(l => (
            <button key={l} onClick={() => { setLang(l); haptic('light') }}
              className={`press flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-extrabold transition-colors ${lang === l ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--panel)] text-[var(--mut2)] active:scale-95'}`}>
              <FlagOf l={l} s={15} />{l.toUpperCase()}
            </button>
          ))}
        </div>

        <div className="px-5 mt-5 mb-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--mut2)] font-extrabold">{t.menuT}</div>
        <nav className="flex-1 overflow-y-auto no-scrollbar px-3">
          {CATS.map(c => (
            <button key={c.id} onClick={() => { haptic(); onClose(); nav(`/cat/${c.id}`) }}
              className={`press w-full flex items-center justify-between px-3 py-3 rounded-xl text-[15.5px] font-bold transition-colors ${activeCat === c.id ? 'bg-[var(--soft)] text-[var(--ink)]' : 'text-[var(--ink)] active:bg-[var(--panel)]'}`}>
              {(c as any)[lang] || t.catNames[c.id]}
              <span className="text-[var(--line2)]"><IcChevR /></span>
            </button>
          ))}
        </nav>

        <div className="px-5 pt-3 mt-2 border-t border-[var(--line)] space-y-0.5">
          <button onClick={() => { onClose(); nav('/orders') }} className="press w-full flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)] active:opacity-70">
            <IcBag /> {t.tabOrders}
          </button>
          <button onClick={() => { onClose(); nav('/profile') }} className="press w-full flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)] active:opacity-70">
            <IcUser /> {t.tabProfile}{user?.name ? ` · ${user.name.split(' ')[0]}` : ''}
          </button>
          <a href="tel:+998951550549" className="flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)]">
            <IcCash /> {t.ctPhoneVal}
          </a>
          <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.25.25-.45.45-.9.45l.3-4.6L18.2 6.8c.35-.3-.1-.5-.55-.2L7.7 13.1l-4.4-1.4c-1-.3-1-1 .2-1.45L20.6 3.3c.8-.3 1.5.2 1.3 1.3Z" /></svg>
            {t.ctTgVal}
          </a>
        </div>
      </aside>
    </div>,
    document.body
  )
}

/* ---------- bosh sahifa headeri ---------- */
export function Header() {
  const { t, mode, user, ob, navOpen, setNavOpen } = useStore()
  const nav = useNavigate()
  const [delOpen, setDelOpen] = useState(false)
  const [pickOpen, setPickOpen] = useState(false)
  const [askState, setAskState] = useState(() => {
    try { return !localStorage.getItem('tk-onboarded') } catch { return true }
  })
  const isWide = useIsWide()
  // birinchi tashrif: bayroq yo'q bo'lsa bir marta so'raladi; yopilsa ham yoziladi
  const askOpen = askState && !!user && !ob
  // Desktopda sidebar ochiqligida brend sarlavhadan yashiriladi (sidebar o'z brendini ko'rsatadi).
  // Faqat md+ da ishlaydi: navOpen holati breakpoint o'tishida mobil brendga tasir qilmaydi.
  const hideBrand = isWide && navOpen
  return (
    <>
      <header className="tk-fade relative z-[31] bg-[var(--bg)] text-[var(--ink)]">
        {/* Uch zonali muvozanat: chap brend klasteri, markazda yetkazish/olib-ketish,
            o'ngda profil + tema. lg+ da grid bir xil kenglikdagi yon ustunlar bilan
            markaziy zonani haqiqiy markazda ushlab turadi; sidebar ochilganda
            konteyner mavjud kenglik ichida qayta markazlashadi. */}
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-4 lg:px-6 py-2 lg:grid lg:grid-cols-[1fr_auto_1fr]">
          <div className="flex items-center gap-1 min-[400px]:gap-1.5 min-w-0 lg:justify-self-start">
            <button onClick={() => nav('/')} aria-label="Tekit Sushi"
              aria-hidden={hideBrand || undefined} tabIndex={hideBrand ? -1 : undefined}
              className={`press flex items-center gap-2 min-w-0 overflow-hidden whitespace-nowrap motion-safe:transition-[opacity,max-width] motion-safe:duration-300 motion-safe:ease-out ${hideBrand ? 'opacity-0 max-w-0 pointer-events-none' : 'opacity-100 max-w-[200px] active:opacity-80'}`}>
              <img src="/logo.png" alt="" className="w-9 h-9 rounded-[10px] shrink-0" />
              <span className="text-[13px] min-[400px]:text-[15px] font-extrabold tracking-[0.08em] whitespace-nowrap">TEKIT SUSHI</span>
            </button>
            {/* mobil: ixcham ikonkali yetkazish/olib-ketish tugmalari */}
            <div className="flex lg:hidden items-center gap-1 ml-0.5">
              {(['delivery', 'pickup'] as const).map(m => (
                <button key={m} aria-haspopup="dialog" aria-label={m === 'delivery' ? t.deliveryMode : t.pickup}
                  onClick={() => { haptic('light'); if (m === 'delivery') setDelOpen(true); else setPickOpen(true) }}
                  className={`press w-9 h-9 rounded-full grid place-items-center shrink-0 transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                  {m === 'delivery' ? <IcTruck s={16} /> : <IcStore s={16} />}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-1.5 lg:justify-self-center">
            {(['delivery', 'pickup'] as const).map(m => (
              <button key={m} aria-haspopup="dialog"
                onClick={() => { haptic('light'); if (m === 'delivery') setDelOpen(true); else setPickOpen(true) }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-[14px] font-bold transition-colors ${mode === m ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                {m === 'delivery' ? <IcTruck s={15} /> : <IcStore s={15} />}{m === 'delivery' ? t.deliveryMode : t.pickup}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1 lg:justify-self-end">
            <button onClick={() => nav('/profile')} className="focus-ring hidden lg:flex items-center gap-2 px-3 py-2.5 text-[14px] font-bold active:opacity-80 transition-opacity rounded-lg">
              <IcUser /> {user?.name ? user.name.split(' ')[0] : t.tabProfile}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>
      <Drawer open={navOpen && !isWide} onClose={() => setNavOpen(false)} />
      <DeliveryModal open={delOpen} onClose={() => setDelOpen(false)} />
      <PickupModal open={pickOpen} onClose={() => setPickOpen(false)} />
      {askOpen && (
        <InitialChoiceModal
          open
          onClose={() => { try { localStorage.setItem('tk-onboarded', '1') } catch {} setAskState(false) }}
        />
      )}
    </>
  )
}

/* ---------- ish stoli uchun push-sidebar (lg+): kontent o'ngga suriladi,
   ustma-ust emas. Mobil (<lg) Drawer ishlatiladi. ---------- */
export function SideNav() {
  const { t, lang, setLang, user, navOpen, setNavOpen } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const isWide = useIsWide()
  const activeCat = loc.pathname.startsWith('/cat/') ? loc.pathname.slice(5) : null
  useEffect(() => {
    if (navOpen && (loc.pathname.startsWith('/p/') || loc.pathname.startsWith('/admin'))) setNavOpen(false)
  }, [loc.pathname, navOpen, setNavOpen])
  /* Breakpoint o'tishida menyuni yopamiz: aks holda torayganda eski holat
     mobil Drawerni o'zi ochib qo'yardi (fon qatlami + skroll qulfi qolardi). */
  useEffect(() => { setNavOpen(false) }, [isWide, setNavOpen])
  /* Suzuvchi chap qator kontent bilan birga surilishi uchun umumiy o'zgaruvchi */
  useEffect(() => {
    const el = document.documentElement
    el.style.setProperty('--nav-w', navOpen && isWide ? '300px' : '0px')
    return () => { el.style.setProperty('--nav-w', '0px') }
  }, [navOpen, isWide])
  /* Mobil Drawer o'z Escape ishlovchisiga ega. Desktopda bu qolimli panel:
     modal fokus-trapi yo'q, Escape uni yopmaydi — faqat X tugmasi. */
  const closeNav = () => {
    setNavOpen(false)
    requestAnimationFrame(() => { const el = document.getElementById('tk-menu-toggle'); if (el) el.focus() })
  }
  // Desktopda sidebar qolimli panel: kategoriya tanlash uni yopmaydi.
  // Bu yerda avval har safar setNavOpen(false) chaqirilgani takroriy qaytishning asosiy sababi edi.
  const go = (to: string) => { haptic(); nav(to) }
  return (
    <aside id="tk-sidenav" aria-label={t.menuT} aria-hidden={!navOpen}
      className={`hidden md:flex flex-col shrink-0 overflow-hidden sticky top-0 self-start h-dvh z-[35] bg-[var(--bg2)] text-[var(--ink)]
        motion-safe:transition-[width,visibility] motion-safe:duration-300 motion-safe:ease-out
        ${navOpen ? 'w-[300px] visible border-r border-[var(--line)]' : 'w-0 invisible'}`}
      style={{ paddingTop: 'calc(14px + var(--sat))', paddingBottom: 'calc(14px + var(--sab))' }}>
      <div className="w-[300px] min-w-[300px] flex flex-col h-full min-h-0">
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="" className="w-9 h-9 rounded-[10px]" />
          <span className="text-[15px] font-extrabold tracking-[0.08em]">TEKIT SUSHI</span>
        </div>
        <button onClick={closeNav} aria-label="close-menu"
          className="press focus-ring w-9 h-9 rounded-xl grid place-items-center text-[var(--mut2)] hover:bg-[var(--soft)] active:scale-95 transition-colors">
          <IcX s={15} />
        </button>
      </div>
      <div className="px-5 flex gap-2">
        {(['uz', 'ru', 'en'] as const).map(l => (
          <button key={l} onClick={() => { setLang(l); haptic('light') }}
            className={`press flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-extrabold transition-colors ${lang === l ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--panel)] text-[var(--mut2)] hover:text-[var(--ink2)]'}`}>
            <FlagOf l={l} s={15} />{l.toUpperCase()}
          </button>
        ))}
      </div>
      <div className="px-5 mt-5 mb-1.5 text-[11px] uppercase tracking-[0.14em] text-[var(--mut2)] font-extrabold">{t.menuT}</div>
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3" aria-label={t.menuT}>
        {CATS.map(c => {
          const on = activeCat === c.id
          return (
            <button key={c.id} onClick={() => go(`/cat/${c.id}`)} aria-current={on ? 'page' : undefined}
              className={`focus-ring press w-full flex items-center justify-between px-3 py-3 rounded-xl text-[15.5px] font-bold transition-colors ${on ? 'bg-[var(--soft)] text-[var(--ink)]' : 'text-[var(--ink2)] hover:bg-[var(--soft)] hover:text-[var(--ink)]'}`}>
              {(c as any)[lang] || t.catNames[c.id]}
              <span className="text-[var(--mut3)]"><IcChevR /></span>
            </button>
          )
        })}
      </nav>
      <div className="px-5 pt-3 mt-2 border-t border-[var(--line)] space-y-0.5">
        <button onClick={() => go('/orders')} className="press focus-ring w-full flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)] active:opacity-70">
          <IcBag /> {t.tabOrders}
        </button>
        <button onClick={() => go('/profile')} className="press focus-ring w-full flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)] active:opacity-70">
          <IcUser /> {t.tabProfile}{user?.name ? ` · ${user.name.split(' ')[0]}` : ''}
        </button>
        <a href="tel:+998951550549" className="flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)]">
          <IcCash /> {t.ctPhoneVal}
        </a>
        <a href="https://t.me/tekitsushi_bot" target="_blank" rel="noreferrer" className="flex items-center gap-2.5 py-2.5 text-[14.5px] font-bold text-[var(--ink)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.6 18.9 19c-.2 1-.8 1.2-1.7.8l-4.6-3.4-2.2 2.1c-.25.25-.45.45-.9.45l.3-4.6L18.2 6.8c.35-.3-.1-.5-.55-.2L7.7 13.1l-4.4-1.4c-1-.3-1-1 .2-1.45L20.6 3.3c.8-.3 1.5.2 1.3 1.3Z" /></svg>
          {t.ctTgVal}
        </a>
      </div>
      </div>
    </aside>
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
      <div ref={wrapRef} className="fixed left-1/2 -translate-x-1/2 z-[45] w-[calc(100%-24px)] max-w-[420px]" style={{ top: 'calc(124px + var(--sat))' }}>
      <div className="flex items-center gap-3 bg-[var(--panel)] border border-[var(--line2)] rounded-2xl px-4 py-3 shadow-[0_18px_44px_-14px_rgba(0,0,0,.6)]">
        <span className="text-[#29A8E0] shrink-0"><IcPin /></span>
        <div className="flex-1 text-[14px] font-bold text-[var(--ink)] leading-snug">{t.cityNote}</div>
        <button onClick={close}
          className="press shrink-0 bg-[var(--chip-on)] text-[var(--chip-on-ink)] text-[13.5px] font-extrabold px-3.5 py-2 rounded-xl active:scale-95 transition-transform">
          {t.cityOk}
        </button>
      </div>
    </div>
    </>
  )
}

/* ---------- qidiruv + tartiblash (kategoriya qatori o'chirildi: kategoriyalar
   burger menyuda; chip qatoridagi funksiyalar shu yerga ko'chirildi) ---------- */
export function SearchChips({ q, setQ }: { q: string; setQ: (s: string) => void }) {
  const { t } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-[var(--bg)]/95 backdrop-blur-md border-b border-[var(--line)]">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-6 py-2">
        {open ? (
          <div className="flex items-center gap-1.5">
            <MenuToggle />
            <div className="relative flex-1 min-w-0">
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search}
                className="w-full bg-[var(--panel)] border border-[var(--line2)] rounded-full py-2.5 pl-11 pr-11 text-[15px] font-medium text-[var(--ink)] placeholder:text-[var(--mut2)] outline-none focus:border-[#29A8E0] focus:ring-2 focus:ring-[#29A8E0]/15" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mut2)]"><IcSearch /></span>
              <button onClick={() => { setOpen(false); setQ('') }} aria-label="close-search"
                className="press focus-ring absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-[var(--mut2)] active:scale-90 transition-transform">
                <IcX s={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MenuToggle />
            <button onClick={() => setOpen(true)} aria-label={t.search}
              className="press focus-ring flex-1 min-w-0 flex items-center gap-2.5 h-[42px] px-4 rounded-full bg-[var(--soft)] text-[var(--mut2)] hover:text-[var(--ink2)] transition-colors text-left text-[15px] font-medium">
              <IcSearch s={17} />
              <span className="truncate">{t.search}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

/* ---------- hamburger: Home sticky qatorida va kategoriya sahifasi qidiruv qatorida ---------- */
export function MenuToggle() {
  const { t, navOpen, setNavOpen } = useStore()
  return (
    <button id="tk-menu-toggle" data-menu-toggle onClick={() => { haptic(); setNavOpen(!navOpen) }}
      aria-label={t.menuT} aria-expanded={navOpen} aria-controls="tk-sidenav"
      className="press focus-ring w-10 h-10 rounded-xl grid place-items-center shrink-0 text-[var(--ink2)] transition-colors hover:bg-[var(--soft)] hover:text-[var(--ink)] active:scale-95">
      <IcBurger s={20} />
    </button>
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
  const searching = open || q.trim().length > 0
  // burger sticky qatorning doimiy qismi: skroll holatidan qat'i nazar ko'rinadi
  const burger = <MenuToggle />

  // faol kategoriya stripda ko'rinadigan joyda turadi
  useEffect(() => {
    if (searching || !active) return
    const strip = stripRef.current
    const el = active ? chipRefs.current[active] : null
    if (!strip || !el) return
    const target = Math.max(0, el.offsetLeft - 12)
    if (Math.abs(strip.scrollLeft - target) > 6) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      strip.scrollTo({ left: target, behavior: reduced ? 'auto' : 'smooth' })
    }
  }, [active, searching, chips.length])

  return (
    <div className="bg-[var(--bg)]">
      <div className="max-w-[1240px] mx-auto px-4 lg:px-6 py-2">
        {searching ? (
          <div className="flex items-center gap-1.5">
            {burger}
            <div className="relative flex-1 min-w-0">
              <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder={t.search} aria-label={t.search}
                className="w-full bg-[var(--panel)] border border-[var(--line2)] rounded-full py-2.5 pl-11 pr-11 text-[15px] font-medium text-[var(--ink)] placeholder:text-[var(--mut2)] outline-none focus:border-[#29A8E0] focus:ring-2 focus:ring-[#29A8E0]/15" />
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--mut2)]"><IcSearch /></span>
              <button onClick={() => { setOpen(false); setQ('') }} aria-label="close-search"
                className="press focus-ring absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 grid place-items-center text-[var(--mut2)] active:scale-90 transition-transform">
                <IcX s={14} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {burger}
            <button onClick={() => setOpen(true)} aria-label={t.search} aria-expanded={false}
              className="press focus-ring flex-none flex items-center justify-center gap-2 h-[38px] w-[38px] lg:w-auto lg:px-4 rounded-full bg-[var(--soft)] text-[var(--mut2)] hover:text-[var(--ink2)] transition-colors">
              <IcSearch s={17} />
              <span className="hidden lg:inline text-[14px] font-medium">{t.search}</span>
            </button>
            <div ref={stripRef} className="min-w-0 flex-1 flex items-center gap-2 overflow-x-auto no-scrollbar" role="tablist" aria-label={t.menuT}>
              {chips.map(c => (
                <button key={c.id} ref={el => { chipRefs.current[c.id] = el }} role="tab" aria-selected={active === c.id}
                  onClick={() => onSelect(c.id)}
                  className={`press focus-ring flex-none h-[38px] px-3.5 rounded-full text-[13.5px] font-bold whitespace-nowrap transition-colors ${active === c.id ? 'bg-[var(--chip-on)] text-[var(--chip-on-ink)]' : 'bg-[var(--soft)] text-[var(--ink2)] hover:text-[var(--ink)]'}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
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
                  <span className="inline-block bg-[#29A8E0] text-white px-2.5 py-1 rounded-full text-[10px] lg:text-[11.5px] font-extrabold uppercase tracking-[0.14em]">{(t as any)[sl.b]}</span>
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

/* ---------- pastki tab-bar (faqat mobil) ---------- */
const ICONS = (on: boolean): Record<string, React.ReactNode> => ({
  home: <IcHome s={22} />,
  cart: <IcBag s={22} />,
  orders: <IcClock s={22} />,
  profile: <IcUser s={22} />,
})

export function TabBar() {
  const { t, cartCount } = useStore()
  const nav = useNavigate()
  const beat = useCartBeat()
  const loc = window.location.pathname
  if (loc.startsWith('/p/')) return null
  const tabs = [
    { id: 'home', to: '/', label: t.tabHome, icon: 'home' },
    { id: 'cart', to: '/cart', label: t.tabCart, icon: 'cart' },
    { id: 'orders', to: '/orders', label: t.tabOrders, icon: 'orders' },
    { id: 'profile', to: '/profile', label: t.tabProfile, icon: 'profile' },
  ]
  return (
    <nav className="fixed left-0 right-0 bottom-0 z-40 bg-[var(--bg)] border-t border-[var(--line)] lg:hidden"
      style={{ paddingBottom: 'calc(8px + var(--sab))' }}>
      <div className="flex">
        {tabs.map(tb => {
          const on = loc === tb.to
          return (
            <button key={tb.id} onClick={() => { if (!on) { haptic(); nav(tb.to) } }}
              className={`press flex-1 flex flex-col items-center gap-0.5 pt-2 text-[11.5px] font-bold transition-colors ${on ? 'text-white' : 'text-[var(--mut2)]'}`}>
              <span className={`relative flex items-center justify-center rounded-2xl transition-all duration-200 ${on ? 'bg-navy-soft px-4 py-1' : 'px-1 py-1'}`}>
                <svg width="23" height="23" viewBox="0 0 16 16" fill="currentColor">{ICONS(on)[tb.icon]}</svg>
                {tb.id === 'cart' && cartCount > 0 && (
                  <span key={'tb' + beat} className={`absolute -top-1.5 -right-2.5 min-w-[17px] h-[17px] rounded-full bg-[#E8462B] text-white text-[10px] font-extrabold grid place-items-center leading-none border-2 border-[var(--bg)] ${beat ? 'cart-beat' : ''}`}>{cartCount}</span>
                )}
              </span>
              {tb.label}
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
export function ProductCard({ p, i = 0 }: { p: Product; i?: number }) {
  const { cart, add, setQty, lang, t, openP } = useStore()
  const q = cart.find((l: any) => l.id === p.id)?.q ?? 0
  const inCart = q > 0
  const sale = p.sale_active && (p.old_price ?? 0) > p.price
  const salePct = sale ? (p.sale_percent || Math.round((1 - p.price / (p.old_price || p.price)) * 100)) : 0
  const wtxt = p.weight || (p.pcs ? `${p.pcs} ${t.pcs}` : '')
  // muvaffaqiyatli qo'shishda tugmada qisqa tasdiq belgisi; tez bosishlarda taymer faqat yangilanadi
  const [ok, setOk] = useState(false)
  const okTimer = useRef<number | null>(null)
  useEffect(() => () => { if (okTimer.current) window.clearTimeout(okTimer.current) }, [])
  const onAdd = () => {
    add(p.id); haptic('medium'); setOk(true)
    if (okTimer.current) window.clearTimeout(okTimer.current)
    okTimer.current = window.setTimeout(() => setOk(false), 700)
  }
  return (
    <article onClick={() => { haptic(); openP(p) }}
      className="anim-up cursor-pointer flex flex-col h-full"
      style={{ animationDelay: `${Math.min(i * 40, 280)}ms` }}>
      <div className={`relative aspect-[7/5] rounded-[12px] overflow-hidden bg-[var(--sheet)] shrink-0 ${inCart ? 'ring-1 ring-inset ring-[var(--chip-on)]/45' : ''}`}>
        <img src={pImg(p)} alt={pName(p, lang)} loading="lazy" decoding="async" className="w-full h-full object-cover" />
        {wtxt && <span className="absolute bottom-2 left-2 bg-black/45 text-white text-[11px] font-bold px-2 py-1 rounded-[8px] backdrop-blur-[2px]">{wtxt}</span>}
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
        {/* Qo'shish tasdig'i ko'rinib bo'lgach miqdor boshqaruvi chiqadi */}
        {inCart && !ok ? (
          <QtyStepper full className="mt-1.5" q={q} min={0}
            onDec={() => { setQty(p.id, q - 1); haptic('light') }}
            onInc={() => { add(p.id); haptic('medium') }} />
        ) : (
          <button onClick={e => { e.stopPropagation(); onAdd() }}
            className={`press mt-1.5 w-full h-[44px] rounded-[12px] flex items-center justify-center gap-2 text-[15px] font-extrabold active:scale-[.98] transition-transform ${sale ? 'bg-[var(--promo-deep)] text-white hover:brightness-110' : 'bg-[var(--btn)] text-[var(--btn-ink)]'}`}>
            {ok ? <span className="add-ok grid place-items-center"><IcCheck s={17} /></span> : <IcBag s={17} />}
            {t.cardAdd}
          </button>
        )}
      </div>
    </article>
  )
}

export function Sheet({ open, onClose, title, children, foot }: {
  open: boolean; onClose: () => void; title: string; children: React.ReactNode; foot?: React.ReactNode
}) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = prev }
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

export function Empty({ emoji, title, sub, action }: { emoji?: string; title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="py-14 text-center">
      <div className="relative w-28 h-28 mx-auto">
        <div className="absolute -inset-4 rounded-full bg-navy-soft/70 blur-2xl opacity-80" />
        <div className="relative tekit-pattern w-28 h-28 rounded-[30px] grid place-items-center text-white shadow-[0_16px_34px_-14px_rgba(10,33,148,.45)]"><IcPlate /></div>
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
        ${ghost ? 'bg-white text-navy-ink border border-navy-line' : 'bg-navy text-white shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)]'} disabled:opacity-40`}>
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
  q: number; onInc: () => void; onDec: () => void; min?: number; size?: 'sm' | 'md'; full?: boolean; className?: string
}) {
  const cfg = size === 'sm'
    ? { box: 'p-1 gap-1 rounded-[12px]', btn: 'w-8 h-8 rounded-[10px]', ic: 13, txt: 'text-[14px]' }
    : { box: 'p-1 gap-1.5 rounded-[14px]', btn: 'w-9 h-9 rounded-[11px]', ic: 15, txt: 'text-[15px]' }
  const btn = `press focus-ring ${cfg.btn} grid place-items-center bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] hover:bg-navy-soft disabled:opacity-35 disabled:pointer-events-none active:scale-90 transition-transform cursor-pointer`
  return (
    <div onClick={e => e.stopPropagation()}
      className={`shrink-0 flex items-center bg-[var(--soft)] border border-[var(--line2)] ${cfg.box} ${full ? 'w-full justify-between' : ''} ${className || ''}`}>
      <button type="button" onClick={onDec} disabled={q <= min} aria-label="minus" className={btn}>
        <IcMinus s={cfg.ic} />
      </button>
      <span className={`${cfg.txt} font-extrabold text-[var(--ink)] min-w-[2ch] text-center tabular-nums`}>{q}</span>
      <button type="button" onClick={onInc} aria-label="plus" className={btn}>
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
function useIsWide() {
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
  const { lang, t, add, setQty, cart, products, favs, toggleFav, openP } = useStore()
  const [q, setQ] = useState(1)
  // tez-qo'piq bosishlarda ortiqcha qator oldini oladi: ref sinxron himoya qiladi,
  // holat esa tugmaning ko'rinishini boshqaradi
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  useEffect(() => { setQ(1); busyRef.current = false; setBusy(false) }, [p?.id])
  const sauces = p ? products.filter(x => x.cat === 'sous' && x.id !== p.id && x.active !== false) : []
  const qtyOf = (sid: string) => cart.find(l => l.id === sid)?.q || 0
  const fav = p ? favs.includes(p.id) : false
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
  const addToCart = () => {
    if (!p || busyRef.current) return
    busyRef.current = true
    setBusy(true); add(p.id, q); haptic('medium')
    window.setTimeout(() => { busyRef.current = false; setBusy(false) }, 350)
  }
  return { lang, t, add, setQty, toggleFav, openP, q, setQ, busy, addToCart, sauces, qtyOf, fav, sale, salePct, wtxt, nutrition, reco }
}

/* Tavsifda menyu ma'lumotidan kelgan literal \n qoldiqlarini haqiqiy qatorboshiga aylantirish */
function cleanDesc(s: string): string {
  return s.replace(/\\n/g, '\n')
}

/* ixcham oziqlik qatori: ikkala taqdimotda bir xil, bo'sh bo'lsa umuman chiqmaydi */
function NutritionRow({ items, per100 }: { items: ReadonlyArray<readonly [string, number | null | undefined, string]>; per100: string }) {
  if (!items.length) return null
  const parts = items.map(([l, v, u]) => `${l} ${v}${u ? ' ' + u : ''}`)
  return (
    <div className="text-[12px] font-semibold text-[var(--mut2)] leading-snug">
      <span className="font-bold">{per100}:</span> {parts.join(' · ')}
    </div>
  )
}

/* sous qo'shish: ixcham boshliq, aniq narx va belgilangan holat */
function SaucePicker({ sauces, qtyOf, setQty, horizontal }: {
  sauces: Product[]; qtyOf: (sid: string) => number; setQty: (id: string, q: number) => void; horizontal?: boolean
}) {
  const { lang, t } = useStore()
  if (!sauces.length) return null
  const row = horizontal ? 'flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 snap-x' : 'flex flex-wrap gap-2'
  return (
    <div>
      <div className="flex items-center gap-1.5 text-[12.5px] font-extrabold text-[var(--ink)]">
        <IcSauce s={14} /> {t.sAddSauces}
      </div>
      <div className={`${row} mt-2.5`}>
        {sauces.map(sa => {
          const sq = qtyOf(sa.id)
          return (
            <div key={sa.id}
              className={'shrink-0 flex items-center gap-2 rounded-full bg-[var(--panel)] border pl-1.5 pr-2 py-1.5 ' + (sq > 0 ? 'border-[var(--chip-on)] shadow-[0_4px_12px_-4px_rgba(10,33,148,.35)]' : 'border-[var(--line2)]') + (horizontal ? ' snap-start' : '')}>
              <img src={pImg(sa)} alt={pName(sa, lang)} loading="lazy" className="w-9 h-9 rounded-full object-cover bg-navy-soft" />
              <div className="pr-0.5">
                <div className="text-[11.5px] font-extrabold leading-none whitespace-nowrap">{pName(sa, lang)}</div>
                <div className="text-[10px] font-bold text-[var(--mut2)] mt-1 leading-none">{fmt(sa.price)} UZS</div>
              </div>
              {sq > 0 && (
                <div className="flex items-center gap-1 ml-0.5">
                  <button onClick={() => { setQty(sa.id, sq - 1); haptic() }}
                    className="press w-7 h-7 rounded-full bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] grid place-items-center hover:bg-navy-soft active:scale-90 transition-all cursor-pointer">
                    <IcMinus s={12} />
                  </button>
                  <span className="w-3.5 text-center text-[11.5px] font-extrabold tabular-nums">{sq}</span>
                </div>
              )}
              <button onClick={() => { setQty(sa.id, sq + 1); haptic(sq > 0 ? undefined : 'light') }}
                className="press w-7 h-7 rounded-full bg-navy text-white grid place-items-center shadow-[0_4px_10px_-3px_rgba(10,33,148,.5)] hover:brightness-110 active:scale-90 transition-all cursor-pointer">
                <IcPlus s={13} />
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* tavsiyalar: bir xil kategoriyadagi real mahsulotlar; bosilganda shu modal almashadi (ustma-ust emas) */
function RecoRow({ items, compact }: { items: Product[]; compact?: boolean }) {
  const { lang, t, openP } = useStore()
  if (!items.length) return null
  const card = (r: Product, wide?: string) => (
    <button key={r.id} onClick={() => { haptic(); openP(r) }}
      className={`shrink-0 snap-start text-left cursor-pointer ${wide || ''}`}>
      <div className="aspect-[7/5] rounded-[12px] overflow-hidden bg-navy-soft">
        <img src={pImg(r)} alt={pName(r, lang)} loading="lazy" className="w-full h-full object-cover" />
      </div>
      <div className="mt-1.5 text-[12.5px] font-bold leading-tight truncate">{pName(r, lang)}</div>
      <div className="mt-0.5 text-[12px] font-extrabold text-[var(--ink)] whitespace-nowrap">{fmt(r.price)} <span className="text-[10px] font-bold text-[var(--mut2)]">UZS</span></div>
    </button>
  )
  return (
    <div>
      <div className="text-[12.5px] font-extrabold text-[var(--ink)]">{t.recoTitle}</div>
      {compact
        ? <div className="mt-2.5 flex gap-2.5 overflow-x-auto pb-1 -mx-1 px-1 snap-x">{items.map(r => card(r, 'w-[148px]'))}</div>
        : <div className="mt-2.5 grid grid-cols-3 gap-3">{items.slice(0, 3).map(r => card(r))}</div>}
    </div>
  )
}

/* ---------- mahsulot modali: katalog, savat va sahifadan ochiladigan yagona modal ---------- */
export function ProductSheet() {
  const { sheetP, closeP } = useStore()
  const isDesktop = useIsDesktop()
  const m = useProductModal(sheetP)
  if (!sheetP) return null
  if (isDesktop) return <DesktopProduct p={sheetP} onClose={closeP} />
  const p = sheetP
  return (
    <Sheet open onClose={closeP} title={pName(p, m.lang)}
      foot={
        <div className="flex gap-2.5 items-center">
          <QtyStepper q={m.q} min={1}
            onInc={() => { m.setQ(v => v + 1); haptic() }}
            onDec={() => { if (m.q > 1) { m.setQ(v => v - 1); haptic() } }} />
          <button onClick={m.addToCart} disabled={m.busy}
            className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] active:scale-[.98] transition-transform disabled:opacity-60">
            {m.t.addCart} · {fmt(p.price * m.q)} <span className="text-[11px] font-bold opacity-70">UZS</span>
          </button>
        </div>
      }>
      {/* 7:5 rasm: bosh sahifa kartochkasi bilan bir xil proporsiya */}
      <div className="relative aspect-[7/5] rounded-[18px] overflow-hidden bg-navy-soft">
        <img src={pImg(p)} alt={pName(p, m.lang)} className="w-full h-full object-cover" />
        <button onClick={() => { m.toggleFav(p.id); haptic(m.fav ? 'light' : 'medium') }}
          className="absolute top-2.5 right-2.5 w-10 h-10 rounded-full bg-[var(--bg2)]/80 grid place-items-center active:scale-90 transition-transform cursor-pointer"
          aria-label="fav" aria-pressed={m.fav}>
          <IcHeart s={19} on={m.fav} />
        </button>
        {m.wtxt && <span className="absolute bottom-2.5 left-3 bg-black/45 text-white text-[11px] font-bold px-2.5 py-1.5 rounded-lg backdrop-blur-[2px]">{m.wtxt}</span>}
      </div>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div className="text-[19px] font-extrabold leading-tight flex-1 min-w-0">{pName(p, m.lang)}</div>
        <div className="text-right shrink-0">
          {m.sale && <div className="text-[12px] font-bold text-[var(--mut2)] line-through">{fmt(p.old_price)} UZS</div>}
          <div className={`text-[18px] font-extrabold tracking-tight whitespace-nowrap ${m.sale ? 'text-[var(--promo-deep)]' : ''}`}>
            {fmt(p.price)}<span className="text-[12px] text-[var(--mut2)] font-bold"> UZS</span>
          </div>
          {m.sale && <div className="mt-0.5 text-[10.5px] font-extrabold text-[var(--promo-deep)]">−{m.salePct}%</div>}
        </div>
      </div>
      <div className="mt-2"><NutritionRow items={m.nutrition} per100={m.t.per100} /></div>
      {p.cat !== 'sous' && <div className="mt-4"><SaucePicker sauces={m.sauces} qtyOf={m.qtyOf} setQty={m.setQty} horizontal /></div>}
      <div className="mt-4"><RecoRow items={m.reco} compact /></div>
      {pDesc(p, m.lang) && <p className="mt-4 text-[13.5px] leading-relaxed text-[var(--mut2)] font-medium whitespace-pre-line">{cleanDesc(pDesc(p, m.lang))}</p>}
    </Sheet>
  )
}

/* ---------- desktop mahsulot moduli (>=1024px): muvozanatli ikki ustunli oyna ---------- */
function DesktopProduct({ p, onClose }: { p: Product; onClose: () => void }) {
  const m = useProductModal(p)
  const [enter, setEnter] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => { const id = window.setTimeout(() => setEnter(true), 10); return () => clearTimeout(id) }, [])
  useEffect(() => {
    const docEl = document.documentElement
    const prevOverflow = document.body.style.overflow
    const prevPad = document.body.style.paddingRight
    const prevScrollY = window.scrollY
    const prevFocus = document.activeElement as HTMLElement | null
    // Windows'da skrollbarga yo'qolishidan keladigan siljishni qoplaymiz
    if (window.innerWidth > docEl.clientWidth) {
      document.body.style.paddingRight = `${window.innerWidth - docEl.clientWidth}px`
    }
    document.body.style.overflow = 'hidden'
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
      document.body.style.overflow = prevOverflow
      document.body.style.paddingRight = prevPad
      if (Math.abs(window.scrollY - prevScrollY) > 2) window.scrollTo(0, prevScrollY)
      try { prevFocus?.focus?.() } catch {}
    }
  }, [onClose])
  return createPortal(
    <div className="fixed inset-0 z-50">
      <div className={`absolute inset-0 bg-black/55 backdrop-blur-[3px] transition-opacity duration-300 ${enter ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className="absolute inset-0 grid place-items-center p-6 pointer-events-none">
        <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label={pName(p, m.lang)}
          className={`pointer-events-auto relative w-[min(1000px,94vw)] max-h-[min(88vh,760px)] flex flex-col outline-none rounded-[26px] bg-[var(--sheet)] shadow-[0_40px_120px_rgba(4,10,40,.55)] overflow-hidden transition-all duration-300 ${enter ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-[0.96] translate-y-2'}`}>
          <button onClick={onClose} aria-label={m.t.closeBtn}
            className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-[var(--panel)] border border-[var(--line2)] grid place-items-center text-[var(--mut2)] hover:text-[var(--ink)] hover:bg-navy-soft active:scale-90 transition-all cursor-pointer">
            <IcX s={16} />
          </button>
          <div className="flex flex-1 min-h-0">
            {/* chap: 7:5 rasm (kartochka bilan bir xil proporsiya); ustun qisqa ekranda ham sig'adi */}
            <div className="w-[400px] shrink-0 flex flex-col justify-center border-r border-[var(--line)] p-6">
              <div className="relative aspect-[7/5] w-full rounded-[16px] overflow-hidden bg-navy-soft shrink-0">
                <img src={pImg(p)} alt={pName(p, m.lang)} className="w-full h-full object-cover" />
                <button onClick={() => { m.toggleFav(p.id); haptic(m.fav ? 'light' : 'medium') }}
                  className="absolute top-3 right-3 w-11 h-11 rounded-full bg-[var(--bg2)]/85 grid place-items-center hover:bg-[var(--bg2)] active:scale-90 transition-all cursor-pointer"
                  aria-label="fav" aria-pressed={m.fav}>
                  <IcHeart s={20} on={m.fav} />
                </button>
                {m.sale && (
                  <span className="absolute top-3 left-3 bg-[var(--promo)] text-[var(--promo-ink)] text-[12px] font-extrabold tracking-wide px-2.5 py-1.5 rounded-[9px]">
                    −{m.salePct}%
                  </span>
                )}
                {m.wtxt && <span className="absolute bottom-3 left-3 bg-black/45 text-white text-[12px] font-bold px-2.5 py-1.5 rounded-[9px] backdrop-blur-[2px]">{m.wtxt}</span>}
              </div>
            </div>
            {/* o'ng: mazmun + buyurtma paneli; faqat shu ustun aylanadi */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              <div className="overflow-y-auto no-scrollbar px-7 pt-7 pb-5 flex-1 min-h-0">
                <div className="text-[23px] font-extrabold leading-tight pr-10">{pName(p, m.lang)}</div>
                <div className="mt-2.5 flex items-baseline gap-3">
                  <div className={`text-[25px] font-extrabold tracking-tight ${m.sale ? 'text-[var(--promo-deep)]' : ''}`}>{fmt(p.price)}<span className="text-[13px] text-[var(--mut2)] font-bold"> UZS</span></div>
                  {m.sale && <div className="text-[14px] font-bold text-[var(--mut2)] line-through">{fmt(p.old_price)} UZS</div>}
                </div>
                <div className="mt-2.5"><NutritionRow items={m.nutrition} per100={m.t.per100} /></div>
                {p.cat !== 'sous' && <div className="mt-5"><SaucePicker sauces={m.sauces} qtyOf={m.qtyOf} setQty={m.setQty} /></div>}
                <div className="mt-5"><RecoRow items={m.reco} /></div>
                {pDesc(p, m.lang) && <p className="mt-5 text-[13.5px] leading-relaxed text-[var(--mut2)] font-medium whitespace-pre-line">{cleanDesc(pDesc(p, m.lang))}</p>}
              </div>
              <div className="px-7 py-4 border-t border-[var(--line)] flex items-center gap-3 bg-[var(--sheet)]">
                <QtyStepper q={m.q} min={1}
                  onInc={() => { m.setQ(v => v + 1); haptic() }}
                  onDec={() => { if (m.q > 1) { m.setQ(v => v - 1); haptic() } }} />
                <button onClick={m.addToCart} disabled={m.busy}
                  className="press flex-1 py-3.5 rounded-2xl bg-navy text-white text-[15px] font-extrabold flex items-center justify-center gap-2 shadow-[0_10px_22px_-8px_rgba(10,33,148,.6)] hover:brightness-110 active:scale-[.98] transition-all cursor-pointer disabled:opacity-60">
                  {m.t.addCart} · {fmt(p.price * m.q)} <span className="text-[11px] font-bold opacity-70">UZS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
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
export function FloatingCart() {
  const { cartCount } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const beat = useCartBeat()
  if (loc.pathname.startsWith('/cart') || loc.pathname.startsWith('/checkout')) return null
  return (
    <button onClick={() => { haptic(); nav('/cart') }} aria-label="cart"
      className="floating-quick press relative w-[var(--float-size)] h-[var(--float-size)] shrink-0 rounded-[18px] bg-navy text-white grid place-items-center shadow-[0_14px_30px_-8px_rgba(10,33,148,.6)] hover:brightness-110 active:scale-95 transition-[transform,filter] cursor-pointer">
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
      className="floating-quick press w-[var(--float-size)] h-[var(--float-size)] shrink-0 rounded-[18px] bg-[var(--panel)] border border-[var(--line2)] text-[var(--ink)] grid place-items-center shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)] hover:bg-[var(--soft)] active:scale-95 transition-[transform,background-color] cursor-pointer">
      <IcArrowUp s={20} />
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
          <span className="w-[44px] h-[44px] rounded-full bg-[var(--sheet)] border border-[var(--line)] grid place-items-center shadow-[0_10px_24px_-10px_rgba(0,0,0,.35)] transition-colors duration-300" style={{ color: done ? 'var(--promo-deep)' : 'var(--ink)' }}>
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
                <circle cx="32" cy="32" r={R2} fill="none" stroke="#29A8E0" strokeWidth="5" strokeLinecap="round" strokeDasharray={C2} strokeDashoffset={C2 * (1 - pct)} style={{ transition: 'stroke-dashoffset .6s cubic-bezier(.32,.72,0,1)' }} />
              </svg>
              <span className="absolute inset-0 grid place-items-center text-[#29A8E0]"><IcTruck s={24} /></span>
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
