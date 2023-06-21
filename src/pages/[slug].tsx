import Head from "next/head";
import { api } from "~/utils/api";
import { createServerSideHelpers } from "@trpc/react-query/server";
import superjson from "superjson";
import { prisma } from "~/server/db";
import { appRouter } from "~/server/api/root";
import { type NextPage, type GetStaticProps } from "next";
import { PageLayout } from "~/components/layout";
import Image from "next/image";

export const getStaticProps: GetStaticProps = async (context) => {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, userId: null },
    transformer: superjson,
  });

  const slug = context.params?.slug;
  if (typeof slug !== "string") throw new Error("No slug");

  await helpers.profile.getUserByUsername.prefetch({ username: slug });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      username: slug,
    },
  };
};

export const getStaticPaths = () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

const ProfilePage: NextPage<{ username: string }> = ({ username }) => {
  const { data } = api.profile.getUserByUsername.useQuery({ username });

  if (!data) return <div>404</div>;

  return (
    <>
      <Head>
        <title>{data.username}</title>
      </Head>
      <PageLayout>
        <div className="relative h-36 bg-slate-600">
          <Image src={data.profilePicture} alt="" 
          width={128} height={128}
          className="absolute rounded-full -mb-[64px] 
          bottom-0 left-0 ml-4 border-4 border-black bg-black"
          />
        </div>
        <div className="h-[64px]"></div>
        <div className="p-4 text-2xl font-bold">{`@${data.username ?? ""}`}</div>
        <div className="w-full border-b border-slate-400"></div>
      </PageLayout>
    </>
  );
};

export default ProfilePage;
