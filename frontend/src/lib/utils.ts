import {clsx, type ClassValue} from "clsx"
import {twMerge} from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAccessToken() {
  console.log(document.cookie)
  return document.cookie
    .split('; ')
    .find(row => row.startsWith('access_token' + '='))
    ?.split('=')[1]
}
