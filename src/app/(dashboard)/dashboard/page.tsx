import { authOptions } from "@/lib/auth";
import { FC } from "react";
import { getServerSession } from "next-auth";

const DashboardPage: FC = async ({}) => {
    const session = await getServerSession(authOptions);

    return <pre>Dashboard</pre>;
};

export default DashboardPage;
