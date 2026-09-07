interface TimelineEvent {
  year: number
  title: string
  description: string
}

const EVENTS: TimelineEvent[] = [
  {
    year: 1559,
    title: 'The Index Librorum Prohibitorum',
    description:
      'Catholic Church publishes the first official list of forbidden books, criminalizing possession under threat of excommunication.',
  },
  {
    year: 1650,
    title: 'Spinoza Suppressed',
    description:
      "Amsterdam Jewish council censures Spinoza's rationalist philosophy, banning his treatises from synagogue study halls.",
  },
  {
    year: 1759,
    title: 'Candide Burned',
    description:
      "Voltaire's satirical novella burned in Paris; the author lives in Swiss border exile to evade the Bastille.",
  },
  {
    year: 1857,
    title: 'Flaubert on Trial',
    description:
      'Gustave Flaubert tried for obscenity over Madame Bovary; acquitted after a sensational defense of realism.',
  },
  {
    year: 1882,
    title: 'Leaves of Grass Banned',
    description:
      'Boston District Attorney threatens prosecution, forcing publisher to cancel printing of Whitman\'s definitive edition.',
  },
  {
    year: 1933,
    title: 'The Nazi Book Burnings',
    description:
      'Tens of thousands of works by Jewish, socialist, and pacifist writers burned publicly across university squares in Germany.',
  },
  {
    year: 1982,
    title: 'Island Trees v. Pico',
    description:
      'US Supreme Court rules local school boards cannot remove books from school libraries simply because they dislike the ideas.',
  },
  {
    year: 2021,
    title: 'The Surge Begins',
    description:
      'Organized ban campaigns in USA explode from ~46 isolated challenges annually to coordinated multi-district challenges.',
  },
  {
    year: 2023,
    title: '4,240 Titles Challenged',
    description:
      'Highest count of challenged books ever documented in modern records, driven by automated mass list submissions.',
  },
  {
    year: 2025,
    title: "Alberta's Mass Ban",
    description:
      'Canadian province removes 202 books in a single sweeping Ministerial Order, demonstrating international expansion.',
  },
]

export default function CensorshipTimeline() {
  return (
    <section className="bg-[#0d0d14] py-24 px-8 relative">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-20">
          <span className="font-['Share_Tech_Mono'] text-xs text-gray-400 uppercase tracking-[0.3em] block">
            FIVE CENTURIES OF RESISTANCE TO SUPPRESSION
          </span>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white font-bold mt-2">
            Censorship Through the Ages
          </h2>
        </div>

        <div className="relative">
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-[#2ecc71]/40 -translate-x-1/2" />

          <div className="space-y-12">
            {EVENTS.map((event, index) => {
              const isLeft = index % 2 === 0

              return (
                <div
                  key={event.year}
                  className="relative flex flex-col md:flex-row items-start md:items-center"
                >
                  {isLeft ? (
                    <>
                      <div className="md:w-1/2 md:pr-12 md:text-right pl-10 md:pl-0">
                        <span className="font-['Share_Tech_Mono'] text-xl sm:text-2xl font-bold text-[#2ecc71] block">
                          {event.year}
                        </span>
                        <h3 className="font-['Playfair_Display'] text-xl text-white font-bold mt-1">
                          {event.title}
                        </h3>
                        <p className="text-base text-gray-400 mt-1">{event.description}</p>
                      </div>
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0d0d14] ring-4 ring-[#2ecc71] top-1.5 md:top-auto" />
                      <div className="hidden md:block md:w-1/2" />
                    </>
                  ) : (
                    <>
                      <div className="hidden md:block md:w-1/2" />
                      <div className="absolute left-4 md:left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#0d0d14] ring-4 ring-[#2ecc71] top-1.5 md:top-auto" />
                      <div className="md:w-1/2 md:pl-12 pl-10">
                        <span className="font-['Share_Tech_Mono'] text-xl sm:text-2xl font-bold text-[#2ecc71] block">
                          {event.year}
                        </span>
                        <h3 className="font-['Playfair_Display'] text-xl text-white font-bold mt-1">
                          {event.title}
                        </h3>
                        <p className="text-base text-gray-400 mt-1">{event.description}</p>
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
