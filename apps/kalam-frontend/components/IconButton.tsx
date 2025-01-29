import { ReactNode } from 'react';

export default function IconButton({
    icon, onClick, activated
}: {
    icon: ReactNode,
    onClick: () => void,
    activated: boolean
}) {
    return <div className={`cursor-pointer rounded p-2 bg-white hover:bg-gray ${activated? "text-emerald-500" : "text-black"}`} onClick={onClick}>
        {icon}
    </div>
}