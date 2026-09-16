type TwitterUser = {
   id: string
   username?: string
   name?: string
   profile_image_url?: string
   [key: string]: unknown
}

type TwitterMedia = {
   media_key: string
   type?: string
   url?: string
   preview_image_url?: string
   [key: string]: unknown
}

type ReferencedTweet = {
   id: string
   type: string
}

type TweetData = {
   id: string
   author_id: string
   attachments?: { media_keys: string[] }
   referenced_tweets?: ReferencedTweet[]
   [key: string]: unknown
}

type TwitterApiResponse = {
   data: TweetData[]
   includes: {
      users: TwitterUser[]
      media: TwitterMedia[]
      tweets: TweetData[]
   }
}

type EnrichedReferencedTweet = TweetData & {
   type: string
   author: TwitterUser | undefined
}

type EnrichedTweet = TweetData & {
   media: TwitterMedia[]
   referenced_tweets: EnrichedReferencedTweet[]
   author?: TwitterUser
}

export const getTweets = async (ids: string[]): Promise<EnrichedTweet[]> => {
   if (ids.length === 0) {
      return []
   }

   const queryParams = new URLSearchParams({
      ids: ids.join(','),
      expansions:
         'author_id,attachments.media_keys,referenced_tweets.id,referenced_tweets.id.author_id',
      'tweet.fields':
         'attachments,author_id,public_metrics,created_at,id,in_reply_to_user_id,referenced_tweets,text',
      'user.fields':
         'id,name,profile_image_url,protected,url,username,verified',
      'media.fields':
         'duration_ms,height,media_key,preview_image_url,type,url,width,public_metrics',
   })

   const response = await fetch(
      `https://api.twitter.com/2/tweets?${queryParams}`,
      {
         headers: {
            Authorization: `Bearer ${process.env.TWITTER_API_KEY}`,
         },
      }
   )

   const tweets = (await response.json()) as TwitterApiResponse

   const getAuthorInfo = (authorId: string) => {
      return tweets.includes.users.find((user) => user.id === authorId)
   }

   const getReferencedTweets = (
      mainTweet: TweetData
   ): EnrichedReferencedTweet[] => {
      const mapped =
         mainTweet.referenced_tweets?.map((referencedTweet) => {
            const fullReferencedTweet = tweets.includes.tweets.find(
               (tweet) => tweet.id === referencedTweet.id
            )

            if (!fullReferencedTweet) {
               return null
            }

            return {
               ...fullReferencedTweet,
               type: referencedTweet.type,
               author: getAuthorInfo(fullReferencedTweet.author_id),
            }
         }) ?? []

      return mapped.filter(
         (
            tweet
         ): tweet is NonNullable<(typeof mapped)[number]> => tweet !== null
      )
   }

   return tweets.data.reduce<EnrichedTweet[]>((allTweets, tweet) => {
      const media =
         tweet.attachments?.media_keys
            .map((key) =>
               tweets.includes.media.find((item) => item.media_key === key)
            )
            .filter(Boolean) as TwitterMedia[] ?? []

      const tweetWithAuthor: EnrichedTweet = {
         ...tweet,
         media,
         referenced_tweets: getReferencedTweets(tweet),
         author: getAuthorInfo(tweet.author_id),
      }

      return [tweetWithAuthor, ...allTweets]
   }, [])
}