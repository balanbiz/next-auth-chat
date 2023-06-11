import { authOptions } from "@/lib/auth";
import { addFriendValidator } from "@/lib/validations/add-friend";
import { getServerSession } from "next-auth";
import { fetchRedis } from "@/helpers/redis";
import { db } from "@/lib/db";
import { z } from "zod";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const { email: emailToAdd } = addFriendValidator.parse(body.email);

        // const idToAdd = (await fetchRedis("get", `user:email:${emailToAdd}`)) as string; or below

        const RESTresponse = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/get/user:email:${emailToAdd}`, {
            headers: {
                Authorization: `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}`,
            },
            cache: "no-store",
        });
        const data = (await RESTresponse.json()) as { result: string | null };

        const idToAdd = data.result;

        // check is user exists

        if (!idToAdd) {
            return new Response("This person does not exist.", { status: 400 });
        }

        // check is user logined

        const session = await getServerSession(authOptions);

        if (!session) {
            return new Response("Unauthorized", { status: 401 });
        }

        // Check if trying add yourself

        if (idToAdd === session.user.id) {
            return new Response("You cannot add yourself as a friend", {
                status: 400,
            });
        }

        // Check if user is already added

        const isAlreadyAdded = (await fetchRedis("sismember", `user:${idToAdd}:incoming_friend_request`, session.user.id)) as 0 | 1;

        if (isAlreadyAdded) {
            return new Response("Already added this user", { status: 400 });
        }

        // Check if user is already friend
        const isAlreadyFriend = (await fetchRedis("sismember", `user:${session.user.id}:friends`, idToAdd)) as 0 | 1;

        if (isAlreadyFriend) {
            return new Response("User is already your friend", { status: 400 });
        }

        // if valid request, send friend request

        db.sadd(`user:${idToAdd}:incoming_friend_requests`, session.user.id);

        return;
    } catch (error) {
        if (error instanceof z.ZodError) {
            return new Response("Invalid request payload", { status: 422 });
        }

        return new Response("Invalid request", { status: 400 });
    }
}
