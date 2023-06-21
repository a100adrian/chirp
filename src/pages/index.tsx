import { SignInButton, useUser } from "@clerk/nextjs";
import { type RouterOutputs, api } from "~/utils/api";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import Image from "next/image";
import { LoadingPage } from "~/components/loading";
import { useState } from "react";
import { toast } from "react-hot-toast";
import Link from "next/link";
import { PageLayout } from "~/components/layout";

dayjs.extend(relativeTime);

const CreatePostWizard = () => {
  const { user } = useUser();
  const [input, setInput] = useState("");
  const ctx = api.useContext();

  const { mutate, isLoading: isPosting } = api.posts.create.useMutation({
    onSuccess: () => {
      setInput("");
      void ctx.posts.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });
  if (!user) return null;

  return (
    <div className="flex w-full gap-3">
      <Image
        src={user.imageUrl}
        className="h-14 w-14 rounded-full"
        alt="d"
        width={56}
        height={56}
      />
      <input
        type="text"
        placeholder="type something..."
        className="grow bg-transparent outline-none"
        value={input}
        disabled={isPosting}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            if (input === "") return;
            mutate({ content: input });
          }
        }}
      />
      {input !== "" && !isPosting && (
        <button onClick={() => mutate({ content: input })}>Post</button>
      )}
      {isPosting && <LoadingPage />}
    </div>
  );
};

type PostWithUser = RouterOutputs["posts"]["getAll"][number];

const PostView = (props: PostWithUser) => {
  const { post, author } = props;
  return (
    <div className="flex gap-3 border-b border-slate-400 p-4" key={post.id}>
      <Image
        src={author.profilePicture}
        className="h-14 w-14 rounded-full"
        alt=""
        width={56}
        height={56}
      />
      <div className="flex flex-col">
        <div className="flex text-slate-300">
          <Link href={`/${author.username}`}>
            <span>{`@${author.username} `}</span>
          </Link>
          <Link href={`/post/${post.id}`}>
            <span className="font-thin">
              {`- ${dayjs(post.createdAt).fromNow()}`}
            </span>
          </Link>
        </div>
        <span className="text-2xl">{post.content}</span>
      </div>
    </div>
  );
};

const Feed = () => {
  const { data, isLoading: postsLoading } = api.posts.getAll.useQuery();

  if (postsLoading) return <LoadingPage />;
  if (!data) return <div>Something went wrong</div>;
  return (
    <div>
      {data.map((fullPost) => (
        <PostView {...fullPost} key={fullPost.post.id} />
      ))}
    </div>
  );
};

const Home = () => {
  const { isLoaded: userLoaded, isSignedIn } = useUser();
  //start fetching asap
  api.posts.getAll.useQuery();
  if (!userLoaded) return <div />;

  return (
    <>
      <PageLayout>
          <div className="flex border-b border-slate-400 p-4">
            {isSignedIn && (
              <div className="flex justify-center">
                <CreatePostWizard />
              </div>
            )}
            {!isSignedIn && <SignInButton />}
          </div>
          <Feed />
      </PageLayout>
    </>
  );
}

export default Home;
