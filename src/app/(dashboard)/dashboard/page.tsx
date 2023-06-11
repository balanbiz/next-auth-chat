import Button from "@/components/ui/Button";
import { authOptions } from "@/lib/auth";
import { FC } from "react";
import { getServerSession } from "next-auth";
import Link from "next/link";

const DashboardPage: FC = async ({}) => {
    const session = await getServerSession(authOptions);

    return (
        <pre>
            <Button>DashboardPage</Button>
            <Link href={"/login"}>sign out</Link>
            {JSON.stringify(session)}
        </pre>
    );
};

export default DashboardPage;
