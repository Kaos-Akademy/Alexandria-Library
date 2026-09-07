// src/lib/bannedBooksData.ts
// Rich editorial data powering the banned books experience.
// Historical ban events, author bios, and editorial commentary.

export interface BanEvent {
  year: number
  entity: string
  country: string
  reasonGiven: string
  action: string
  outcome?: string
}

export interface BannedBookProfile {
  slug: string
  title: string
  onChainTitle: string
  author: string
  yearWritten: number
  nationality: string
  era: string
  genre: string[]
  coverColor: string          // hex for typographic cover background
  pullQuote: string
  pullQuoteAttribution: string
  banHistory: BanEvent[]
  authorBio: {
    born: string
    died?: string
    nationality: string
    era: string
    otherWorks: string[]
    politicalContext: string
  }
  whyDangerous: string
  whatBanReveals: string
  whyReadIt: string
  featuredParagraphs: {
    chapterTitle: string
    paragraphIndex: number
    label: string
  }[]
}

export const bannedBooks: BannedBookProfile[] = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. THE AWAKENING — Kate Chopin, 1899
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'the-awakening',
    title: 'The Awakening',
    onChainTitle: 'The Awakening',
    author: 'Kate Chopin',
    yearWritten: 1899,
    nationality: 'American',
    era: '19th Century',
    genre: ['Literary Fiction', 'Proto-Feminist'],
    coverColor: '#7c2d12',
    pullQuote:
      'She was becoming herself and daily casting aside that fictitious self which we assume like a garment with which to appear before the world.',
    pullQuoteAttribution: 'Kate Chopin, The Awakening, Chapter XIX',
    banHistory: [
      {
        year: 1899,
        entity: 'St. Louis Republic and Mirror critics',
        country: 'United States',
        reasonGiven:
          'Depicted a married woman who abandons her husband and children in pursuit of self-discovery and sexual independence; deemed immoral and unwholesome.',
        action:
          'Widespread critical condemnation; Chopin was effectively blacklisted from genteel literary society. The book was reportedly removed from the St. Louis Mercantile Library circulation.',
        outcome:
          'The novel fell out of print and was largely forgotten until its rediscovery by feminist scholars in the 1960s and 1970s.',
      },
      {
        year: 1988,
        entity: 'Challenged in school districts',
        country: 'United States',
        reasonGiven:
          'Sexual content, themes of suicide, abandonment of motherhood, and infidelity considered inappropriate for young readers.',
        action:
          'Challenged for removal from high school reading lists and public school libraries in multiple states including Louisiana and Texas.',
        outcome:
          'Most challenges were unsuccessful; the novel is now a canonical text in American literature courses.',
      },
    ],
    authorBio: {
      born: 'February 8, 1850, St. Louis, Missouri',
      died: 'August 22, 1904, St. Louis, Missouri',
      nationality: 'American',
      era: 'Realism / Proto-Modernism',
      otherWorks: ['Bayou Folk', 'A Night in Acadie', 'At Fault'],
      politicalContext: `Kate Chopin wrote in the post-Reconstruction American South, a society strangled by Victorian propriety and the ideology of the "angel in the house" — the notion that a woman's highest calling was selfless devotion to husband, children, and domestic order. New Orleans Creole society, where The Awakening is set, was simultaneously more sensual and more rigidly stratified than the Protestant North, creating a pressure cooker of repressed desire and social obligation.

The 1890s were a decade of ferment for American women. The first wave of feminism was cresting, with suffragists demanding the vote and a small vanguard of New Women refusing the constraints of Victorian marriage. Yet the legal and social architecture of female subjugation remained almost entirely intact: married women could not own property in most states, divorce was scandalous, and female sexual desire was officially deemed nonexistent or pathological.

Chopin herself was a widow who managed a plantation and ran a general store alone after her husband Oscar's death in 1882, experiences that gave her an intimate understanding of both female capability and social limitation. She wrote in stolen hours between raising six children, producing short stories that observed Creole life with anthropological precision and startling sympathy. The Awakening synthesized these observations into something neither her editors nor her readers were prepared for: a heroine who experiences desire on her own terms.

The critical catastrophe that followed the novel's publication effectively ended Chopin's career. She died four years later, before the full measure of what she had achieved could be appreciated. It would take seventy years and a second wave of feminism to exhume her masterpiece.`,
    },
    whyDangerous: `The Awakening is dangerous because it refuses the redemptive arc that 19th-century culture demanded of transgressive women. Emma Bovary kills herself in shame; Anna Karenina throws herself under a train; Hester Prynne accepts her scarlet letter. Edna Pontellier does none of these things. She simply chooses — to paint, to swim, to sleep with whom she wants, to move out of her husband's house — and the novel treats these choices as reasonable assertions of selfhood rather than moral catastrophe.

This was revolutionary because it denied readers the catharsis of punishment. A sinful woman who suffers is a morality tale. A sinful woman who asserts herself without apology, who names her desires and acts on them, is a blueprint. The critics who attacked the novel in 1899 understood this perfectly: Edna's story was not merely immoral, it was instructional. It showed women what it looked like to want more than domesticity — and to take it.

The ocean itself, in Chopin's telling, is eroticized as a space of radical freedom: it calls to Edna, it holds her, it offers the only sovereignty she can find. That the novel ends with her walking into it — choosing dissolution over return to constraint — was not a punishment the author designed but a logical terminus of a world that offered no other exit.`,
    whatBanReveals: `The suppression of The Awakening reveals the degree to which the 19th-century literary establishment functioned as a moral enforcement mechanism. Critics did not simply dislike the book; they moved to destroy its author's career because they understood that the novel's quiet radicalism — its refusal to judge Edna, its sympathy for female desire — was a genuine threat to the social order if widely read.

The erasure worked. The novel vanished from shelves and syllabi for nearly seven decades. Its rediscovery in the 1960s by scholars like Per Seyersted and Cyrille Arnavon was itself an act of literary archaeology — a reclaiming of a voice that patriarchal criticism had successfully silenced. The ban, in other words, succeeded on its own terms. Chopin never published another novel. The story of what American literature might have looked like had she lived and continued writing is one of the great counterfactual tragedies.

What the suppression also reveals is how censorship frequently operates not through official prohibition but through social pressure, critical consensus, and the economics of publishing. No government banned The Awakening. Society did — by making it unpublishable, unsellable, and unrespectable, ensuring the author paid a price steep enough to deter successors.`,
    whyReadIt: `Read The Awakening because it is one of the few 19th-century novels in which female interiority is the primary subject rather than a narrative device. Chopin renders Edna's consciousness with the same careful attention that Henry James lavished on his male protagonists — and she does it in a fraction of the page count, with a prose style so clean and precise it reads almost like poetry.

Read it because the questions it raises — about the incompatibility of selfhood and social obligation, about whether freedom requires solitude, about what we owe our children versus what we owe ourselves — are unresolved and alive. The novel does not answer them. It makes you feel the weight of them in your body.

Read it, finally, because it was taken from you. Not personally — but culturally. The suppression of The Awakening is a story about how societies manage dissent by erasing the voices that articulate it. To read Chopin now is to perform a small act of restitution: to restore to circulation what was deliberately withheld.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter VI',
        paragraphIndex: 3,
        label: "Edna's first full encounter with the sea — the novel's central metaphor for liberation.",
      },
      {
        chapterTitle: 'Chapter XI',
        paragraphIndex: 1,
        label:
          "The night Edna learns to swim — her declaration that she will not go inside on her husband's command.",
      },
      {
        chapterTitle: 'Chapter XXVIII',
        paragraphIndex: 2,
        label:
          "The morning after the night with Arobin — Chopin's remarkable refusal to punish Edna with guilt.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 2. ADVENTURES OF HUCKLEBERRY FINN — Mark Twain, 1884
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'adventures-of-huckleberry-finn',
    title: 'Adventures of Huckleberry Finn',
    onChainTitle: 'Adventures of Huckleberry Finn',
    author: 'Mark Twain',
    yearWritten: 1884,
    nationality: 'American',
    era: '19th Century',
    genre: ['Satire', 'Coming-of-Age', 'Adventure'],
    coverColor: '#7c2d12',
    pullQuote:
      "All right, then, I'll go to hell.",
    pullQuoteAttribution: 'Mark Twain, Adventures of Huckleberry Finn, Chapter XXXI',
    banHistory: [
      {
        year: 1885,
        entity: 'Concord (Massachusetts) Public Library',
        country: 'United States',
        reasonGiven:
          'Deemed "trash and suitable only for the slums" — the library committee cited its coarse language, its depiction of a boy who lies and steals, and its perceived vulgar humor as evidence that it was morally corrupting.',
        action: 'Removed from library shelves within weeks of publication.',
        outcome:
          'The ban arguably boosted sales. Twain quipped that the Concord action would likely sell 25,000 additional copies. He was right.',
      },
      {
        year: 1957,
        entity: 'New York City Board of Education',
        country: 'United States',
        reasonGiven:
          "Racial slurs throughout the text — the novel uses the n-word over 200 times — deemed demeaning and harmful to Black students.",
        action: 'Removed from the approved textbook list for New York City schools.',
        outcome:
          'The debate over the novel\'s classroom use continues into the 21st century, producing "sanitized" editions that replace racial slurs — a practice itself controversial among scholars.',
      },
      {
        year: 1998,
        entity: 'Mesa Unified School District',
        country: 'United States',
        reasonGiven:
          'Racist language and stereotypical depictions of Black characters created a hostile learning environment for Black students.',
        action:
          'Challenged for removal from required reading lists; led to community debates about teaching difficult texts in context.',
        outcome:
          'Book retained with accompanying contextual materials and classroom discussion guidelines.',
      },
    ],
    authorBio: {
      born: 'November 30, 1835, Florida, Missouri',
      died: 'April 21, 1910, Redding, Connecticut',
      nationality: 'American',
      era: 'Realism / Gilded Age',
      otherWorks: [
        'The Adventures of Tom Sawyer',
        'The Prince and the Pauper',
        'A Connecticut Yankee in King Arthur\'s Court',
        'Pudd\'nhead Wilson',
      ],
      politicalContext: `Samuel Langhorne Clemens grew up in Hannibal, Missouri, a slaveholding river town that would supply the material for both Tom Sawyer and Huckleberry Finn. His childhood was shaped by the violence and casual dehumanization of American chattel slavery — he witnessed slave auctions, watched men in chains, and absorbed without conscious analysis the racial hierarchies that organized his world. The pen name Mark Twain came from his years as a Mississippi riverboat pilot, the last period before the Civil War shattered the antebellum world he knew.

When Twain sat down to write Huckleberry Finn between 1876 and 1884, he was processing the failure of Reconstruction. The brief post-Civil War experiment in Black political enfranchisement had been murdered by white terrorism and the Compromise of 1877, which effectively ended Federal oversight of the South and restored white supremacist governance. The novel is set before the Civil War, but it is written in the bitter, irony-saturated knowledge of what came after: that the war was won, slavery abolished on paper, and the underlying machinery of racial oppression rebuilt with astonishing speed.

Twain's genius — and his lasting controversy — is that he put an abolitionist argument in the mouth of a poor white boy who thinks he's going to hell for it. Huck helping Jim escape is, in his own moral universe, a sin; yet he does it anyway. This is Twain's indictment of society's moral education: when a child's conscience is more humane than the religion and law that raised him, it is the religion and law that are wrong.

In his later years, Twain became increasingly radical — a passionate anti-imperialist, a savage critic of American foreign policy in the Philippines, a man whose darkness deepened after the deaths of his wife and daughters. The Autobiography he dictated toward the end of his life contained passages so incendiary he stipulated they not be published for 100 years after his death.`,
    },
    whyDangerous: `Huckleberry Finn is dangerous for opposite reasons in different centuries. In 1885, it was dangerous because it showed sympathy for a runaway slave and contempt for the religion, law, and social order of the antebellum South — wrapped in a vernacular prose style so funny and readable that the subversion might slip past a reader's defenses before they noticed what Twain was actually saying.

In the 20th and 21st centuries, it is dangerous for a different reason: the same racial slurs that were part of Twain's satirical attack on white supremacy now cause real harm to Black students forced to read or hear them in classroom settings. This is not a contradiction but a reminder that language has context, and that context changes. The word Twain used to mock the slaveholders who used it freely now lands differently in an integrated classroom than it did in a white reader's parlor in 1885.

The deepest danger of the book, the one that makes it worth preserving and arguing about rather than either sanitizing or discarding, is its insistence that conscience can overrule civilization. Huck's "All right, then, I'll go to hell" is one of the most radical sentences in American literature: it is a boy choosing his friend's freedom over his own soul's safety, turning his back on every authority — parental, religious, legal — that his society has taught him to revere.`,
    whatBanReveals: `The 1885 Concord ban reveals the anxiety of the American literary establishment about vernacular, democratic art. The novel was written in Huck's voice — uneducated, grammatically improper, morally confused — and the genteel tradition found this democratization of the narrative voice threatening to standards that served as class markers. High literature was supposed to instruct, to elevate, to model correct speech and correct morals. Twain's novel did neither, and worse, it was funny about it.

The later waves of banning, from mid-20th century onward, reveal a different and more complex anxiety: how to teach a book that contains its subject's critique within the very language of that subject's oppression. African American scholars and community members who object to the novel's classroom use are not wrong to point out its harm. The debate they have forced — about who gets to decide when a canonical text's pedagogical value outweighs its cost to certain readers — is one of the most important in American education.

Both banning impulses, a century apart, share one feature: they reflect discomfort with the novel's refusal to let readers off the hook. Twain forces everyone who engages with the book to confront something uncomfortable, whether the violence undergirding American civilization or the complexities of representation in literature about that violence.`,
    whyReadIt: `Read Huckleberry Finn because its prose is one of the great achievements of American English. Twain invented a way of writing — vernacular, rhythmic, ironic, colloquial — that reverberates through Hemingway, Salinger, Carver, and half of American literature that followed. To read Huck's voice is to hear the American vernacular tradition at its source.

Read it because the moral argument at its center is still unresolved. America has still not fully reckoned with the legacy of slavery, the failure of Reconstruction, or the gap between its stated ideals and its actual history. The novel is a record of that gap, written from inside it, by a man who saw clearly what his society was choosing not to see.

Read it with full knowledge of its contradictions. It is simultaneously an anti-racist masterwork and a text that has caused documented harm to Black readers in American classrooms. Holding both of these truths at once is itself a form of intellectual honesty that Twain, who understood irony better than almost anyone, would have approved of.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter XIV',
        paragraphIndex: 5,
        label:
          "Huck and Jim debate Solomon — Jim's argument dismantles Huck's confident assertions with devastating logic.",
      },
      {
        chapterTitle: 'Chapter XXXI',
        paragraphIndex: 8,
        label:
          '"All right, then, I\'ll go to hell" — the moral climax of the novel, Huck\'s decision to help Jim at the cost of his own soul.',
      },
      {
        chapterTitle: 'Chapter XIX',
        paragraphIndex: 2,
        label:
          "Huck and Jim on the raft at night — the novel's tenderest passage, the friendship at its purest.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 3. LES MISÉRABLES — Victor Hugo, 1862
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'les-miserables',
    title: 'Les Misérables',
    onChainTitle: 'Les Misérables',
    author: 'Victor Hugo',
    yearWritten: 1862,
    nationality: 'French',
    era: '19th Century',
    genre: ['Historical Fiction', 'Social Critique', 'Epic'],
    coverColor: '#7c2d12',
    pullQuote:
      'To love another person is to see the face of God.',
    pullQuoteAttribution: 'Victor Hugo, Les Misérables (also adapted in the musical)',
    banHistory: [
      {
        year: 1864,
        entity: 'Congregation of the Index (Holy Office)',
        country: 'Vatican / International',
        reasonGiven:
          "Placed on the Index Librorum Prohibitorum for its perceived endorsement of revolutionary politics, its sympathy for criminals and social outcasts, and its implicit critique of the Church's role in maintaining poverty and injustice.",
        action: 'Added to the Index of Forbidden Books, prohibiting Catholics from reading it.',
        outcome:
          'The Index ban made the novel more famous throughout Europe and increased demand. Hugo, already in political exile, was unmoved.',
      },
      {
        year: 1862,
        entity: 'Conservative literary and political press',
        country: 'France',
        reasonGiven:
          "Deemed dangerously sympathetic to the revolutionary poor; the Goncourt brothers called it 'a book that tends to the destruction of social order.' Napoleon III's government monitored its reception closely.",
        action:
          'Official concern without formal prohibition; the novel was allowed to circulate but was viewed with suspicion by the imperial government.',
        outcome:
          'Hugo was already in exile in Guernsey at the time of publication, having fled France after Louis-Napoleon\'s coup of 1851.',
      },
      {
        year: 1939,
        entity: 'Franco regime',
        country: 'Spain',
        reasonGiven:
          'Republican and leftist associations; the novel was associated with the political left and democratic movements that Francoism sought to destroy.',
        action: 'Restricted in Francoist Spain during the early years of the dictatorship.',
        outcome: 'Restriction gradually loosened as the Franco regime consolidated power.',
      },
    ],
    authorBio: {
      born: 'February 26, 1802, Besançon, France',
      died: 'May 22, 1885, Paris, France',
      nationality: 'French',
      era: 'Romanticism / Social Realism',
      otherWorks: [
        'Notre-Dame de Paris (The Hunchback of Notre-Dame)',
        'The Man Who Laughs',
        'Toilers of the Sea',
        'Hernani',
      ],
      politicalContext: `Victor Hugo was born in the year of the First French Republic's death — Napoleon Bonaparte was Consul for Life, about to crown himself Emperor. Hugo grew up under one empire, witnessed three revolutions (1830, 1848, 1871), two republics, and a second empire. He was not merely a witness to French political history; he was an actor in it, serving as a peer of France, a member of the National Assembly, and eventually one of the most important political voices of his era.

Hugo began his career as a royalist — his early poetry was written in the shadow of his father, one of Napoleon's generals, and his mother's legitimist Catholicism. But he moved steadily leftward through his long life, radicalized by poverty, injustice, and the repeated spectacle of French authority crushing the poor. By the time he wrote Les Misérables, he had spent eleven years in exile — first in Brussels, then in Jersey, then in Guernsey — having refused to accommodate himself to Louis-Napoleon's Second Empire after the coup of 1851.

The novel's gestation spans nearly two decades. Hugo began it in the 1840s, before his exile, intending a study of poverty and crime; he completed it in Guernsey, suffused with the bitterness of exile and the moral urgency of a man who had seen revolution fail multiple times. The result is something far larger than a novel of social protest: it is a theological argument about the nature of grace, a philosophy of history, a theory of how individual transformation connects to collective liberation.

Hugo returned to France in 1870 when the Third Republic was declared, greeted as a national hero. He lived to see the Paris Commune and its bloody suppression, and died in 1885, a secular saint whose state funeral was attended by two million people — the largest public gathering in French history to that point.`,
    },
    whyDangerous: `Les Misérables is dangerous because it makes the case, over nearly 1,500 pages, that the law and justice are not the same thing. Inspector Javert, the novel's great antagonist, is not a villain — he is a man of absolute integrity who enforces the law perfectly and is destroyed by the discovery that perfect law-enforcement can be morally catastrophic. This is Hugo's indictment not of bad policemen but of the system of law itself, when that system is built to protect property rather than persons.

The novel's sympathy radiates outward from Jean Valjean — a man broken by the system, rebuilt by a single act of grace — to encompass the student revolutionaries of the 1832 barricades, the child laborers, the fallen women, the sewers of Paris, the battlefield dead of Waterloo. Hugo insists that every one of these lives matters, that the suffering of the poor is not natural or inevitable but produced by specific choices made by specific social arrangements. This systemic analysis, dressed in sentiment and narrative momentum, is more subversive than any pamphlet.

The Vatican understood this when it placed the novel on the Index. A theological argument wrapped in a love story and an adventure narrative is harder to dismiss than a political treatise. It reaches readers who would never pick up a radical text, and plants in them the radical idea that the present social order is not ordained by God but constructed by men, and can be reconstructed differently.`,
    whatBanReveals: `The Index's censure of Les Misérables in 1864 reveals the Catholic Church's acute awareness that the novel challenged its moral authority in two distinct ways. First, Hugo's most Christ-like figure is not a priest but a bishop — Monseigneur Bienvenu — whose act of grace toward Valjean is the novel's moral engine. This implied that institutional Christianity might be less Christian than individual human charity, a dangerous comparison in 1864.

Second, the novel's sympathetic treatment of the 1832 revolutionaries, of Fantine's prostitution, of Thénardier's systematic exploitation — its entire moral geography — placed human dignity and suffering above legal order and clerical authority. The Church banned what it could not refute: Hugo's argument that the poor deserved redemption and that the rich bore responsibility for their condition.

The banning also reveals how fiction functions as political philosophy under censorship conditions. When direct political speech is suppressed or monitored, narrative becomes the vessel for dissent. Hugo's exile and the novel's reception across Europe — adored by republicans, condemned by monarchists and churchmen — demonstrates that everyone understood perfectly what the book was arguing, which is why everyone fought so hard over who got to read it.`,
    whyReadIt: `Read Les Misérables because it is one of the last great works of literature in which the author genuinely believed that a single book could change the moral trajectory of civilization. Hugo wrote it in that belief, and the ambition is legible on every page. There is something almost intoxicating about inhabiting a mind that capacious, that earnest, that willing to argue for the possibility of human transformation.

Read it for Valjean, whose arc across the novel — from hardened ex-convict to hidden saint — is one of literature's great portraits of moral reconstruction. Read it for Javert, whose perfect integrity makes him the most tragic character in a tragic book. Read it for Éponine, for Gavroche, for the Thénardiers, for the bishop — Hugo's gallery of the wretched and the merciful is inexhaustible.

Read it, finally, because it was written from exile, by a man who chose discomfort and distance over accommodation to power, and who spent those years making the most sustained argument for human dignity in the 19th-century novel. That argument is still not won. The question Hugo asked — what do the fortunate owe the wretched? — is still being answered, badly, every day.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Volume One, Book Two: The Fall — Chapter XII',
        paragraphIndex: 4,
        label:
          "The bishop's lie to the gendarmes — the act of grace that launches the entire novel.",
      },
      {
        chapterTitle: 'Volume Two, Book Seven: Patron-Minette — Chapter I',
        paragraphIndex: 1,
        label:
          "Hugo's meditation on the criminal underworld as a mirror of respectable society.",
      },
      {
        chapterTitle: 'Volume Five, Book One: The War Between Four Walls — Chapter V',
        paragraphIndex: 3,
        label: "The barricade at its height — the death of Enjolras and Grantaire, side by side.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 4. LEAVES OF GRASS — Walt Whitman, 1855
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'leaves-of-grass',
    title: 'Leaves of Grass',
    onChainTitle: 'Leaves of Grass',
    author: 'Walt Whitman',
    yearWritten: 1855,
    nationality: 'American',
    era: '19th Century',
    genre: ['Poetry', 'Transcendentalism', 'Democratic Verse'],
    coverColor: '#7c2d12',
    pullQuote:
      'I am large, I contain multitudes.',
    pullQuoteAttribution: 'Walt Whitman, Song of Myself, Section 51',
    banHistory: [
      {
        year: 1882,
        entity: 'Boston District Attorney Oliver Stevens',
        country: 'United States',
        reasonGiven:
          'The 1881 edition was deemed obscene under Massachusetts law; Stevens threatened Whitman\'s publisher, James R. Osgood, with criminal prosecution for publishing "obscene literature."',
        action:
          'Publisher Osgood dropped the book rather than face prosecution; Whitman found a new publisher in Philadelphia.',
        outcome:
          "The scandal generated enormous publicity. Whitman reportedly said the ban 'had the best kind of effect' on sales. The Philadelphia edition sold well, and 'Leaves of Grass' became more widely known.",
      },
      {
        year: 1865,
        entity: 'Department of the Interior, Secretary James Harlan',
        country: 'United States',
        reasonGiven:
          'Secretary Harlan discovered Whitman (who worked as a government clerk) had authored Leaves of Grass, which Harlan considered immoral. The annotated manuscript of the book was found in Whitman\'s desk.',
        action: "Whitman was fired from his government clerkship for being the author of an 'immoral' book.",
        outcome:
          'Whitman was immediately rehired by the Attorney General\'s office, and the incident prompted his friend William O\'Connor to write the pamphlet "The Good Gray Poet," which helped rehabilitate Whitman\'s reputation.',
      },
    ],
    authorBio: {
      born: 'May 31, 1819, West Hills, Long Island, New York',
      died: 'March 26, 1892, Camden, New Jersey',
      nationality: 'American',
      era: 'Transcendentalism / Romanticism',
      otherWorks: ['Drum-Taps', 'Democratic Vistas', 'Specimen Days', 'O Captain! My Captain!'],
      politicalContext: `Walt Whitman came of age in Jacksonian America, a moment of expansive democratic optimism shadowed by the gathering catastrophe of slavery. He worked as a printer, journalist, essayist, and schoolteacher before the first edition of Leaves of Grass appeared in 1855 — self-published, self-typeset, with the author's name nowhere on the cover but his face engraved as frontispiece, looking out with the informal confidence of a workman rather than a gentleman of letters.

Whitman's America was tearing itself apart over slavery even as it celebrated its continental expansion, and his poetry tried to hold the contradictions together: celebrating the American democratic experiment while demanding it live up to its own promises. He was influenced by Emerson's transcendentalism — Emerson wrote him that the first edition was "the most extraordinary piece of wit and wisdom that America has yet contributed" — but his vision was more physical, more democratic, more insistently embodied than Emerson's. Where Emerson transcended the body, Whitman celebrated it.

The Civil War broke and transformed him. He spent much of the war in Washington, D.C., visiting wounded soldiers in hospitals, writing letters for men who could not write, sitting with the dying. Drum-Taps and Sequel (which included his great Lincoln elegies) emerged from these years as a record of enormous grief. The war confirmed his belief in the Union but shattered his earlier optimism; Democratic Vistas, written in 1871, is a scathing critique of American materialism and corruption that sounds remarkably contemporary.

His later decades were marked by declining health, growing international fame, and the cultivation of a persona — "the good gray poet" — that he managed as carefully as any modern celebrity. He revised Leaves of Grass continuously until his death, producing nine editions that represent one of the strangest, most ambitious revision projects in literary history.`,
    },
    whyDangerous: `Leaves of Grass was dangerous because it refused to treat the human body as something to be hidden, spiritualized away, or spoken of only in medical or theological terms. Whitman wrote about bodies — male bodies, female bodies, his own body — with the same unembarrassed directness that he wrote about the American landscape. The "Calamus" poems, with their barely veiled homoerotic imagery, and the "Children of Adam" sequence, with its frank celebration of heterosexual desire, represented something American literature had simply never seen before.

But the deeper danger was political, not sexual. Whitman's democratic project — his insistence on cataloguing and celebrating every American, from slave to president, from prostitute to farmer — was an assault on the hierarchical assumptions of genteel culture. To place a slave and a senator in the same line of verse, to treat both as equally deserving of the poet's attention and love, was a radical act in 1855. Song of Myself is a democratic manifesto written as lyric poetry, which made it harder to dismiss than a political pamphlet.

The "I" of Leaves of Grass is also dangerous because it expands to include everything and everyone. "I contain multitudes" is not boasting but ontological: Whitman's self is deliberately coextensive with the American project, which means that any exclusion from America — of Black people, of women, of the poor — is also an exclusion from the self the poem is constructing. This is subversive in ways the Boston District Attorney probably couldn't fully articulate, which is why he fell back on obscenity charges.`,
    whatBanReveals: `The Boston ban reveals the intimate connection between sexual censorship and political censorship in 19th-century America. The District Attorney's office came for obscenity, but what it was really suppressing was a vision of American democracy that included bodies, desires, and people that polite culture preferred to manage through silence and invisibility. Sexual frankness and democratic radicalism turned out to be inseparable in Whitman's work, because both threatened the same Victorian hierarchies of propriety and propriety's close cousin, property.

The firing of Whitman from his government clerkship reveals how completely the state had internalized the idea that an author's published work determined their fitness for civic life. To have written an immoral book was to be, oneself, immoral — irredeemably so, regardless of the quality of one's work performance. This logic — that artistic transgression disqualifies a person from civil society — is one that has been applied repeatedly throughout history, and it's worth noting that in Whitman's case it didn't fully stick: the Attorney General's office rehired him the same day.

The bans also reveal how censorship can backfire. Whitman understood that controversy was a form of advertising, and he was not above cultivating it. He published Emerson's private letter of praise — without Emerson's permission — as a promotional endorsement. He was the first great American poet of self-promotion, and the censors were unwitting collaborators in his project.`,
    whyReadIt: `Read Leaves of Grass because it invented an American poetic voice that is still the ground on which American poetry stands. Ginsberg's "Howl," Langston Hughes's blues poetry, Galway Kinnell's body-centered verse, Allen Grossman's democratic inclusivity — all of them owe a direct and acknowledged debt to Whitman. To read him is to read the source code.

Read it because Song of Myself is one of literature's great experiments in ego and its dissolution. Whitman's "I" is so large it keeps dissolving into everyone else — "For every atom belonging to me as good belongs to you" — and this movement between self and world, between the individual and the democratic collective, produces a kind of reading experience that no other poem quite replicates.

Read it in the knowledge that it cost its author his government job and nearly his publisher, and that he kept revising it anyway, across nine editions and thirty-seven years, because he believed it was his life's work and America's future. That kind of sustained, obstinate commitment to a vision — in the face of censorship, poverty, and indifference — is itself an argument for why literature matters.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Song of Myself, Section 1',
        paragraphIndex: 1,
        label:
          '"I celebrate myself" — the opening that announced an entirely new relationship between poet and reader.',
      },
      {
        chapterTitle: 'Song of Myself, Section 11',
        paragraphIndex: 1,
        label:
          'The twenty-eight young men bathing — the most openly homoerotic passage, veiled in a female persona.',
      },
      {
        chapterTitle: 'Calamus, Number 11',
        paragraphIndex: 1,
        label:
          "\"When I Heard at the Close of the Day\" — Whitman's most direct lyric of male love.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 5. THE COMMUNIST MANIFESTO — Karl Marx & Friedrich Engels, 1848
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'the-communist-manifesto',
    title: 'The Communist Manifesto',
    onChainTitle: 'The Communist Manifesto',
    author: 'Karl Marx',
    yearWritten: 1848,
    nationality: 'German',
    era: '19th Century',
    genre: ['Political Philosophy', 'Manifesto'],
    coverColor: '#7c2d12',
    pullQuote:
      'The history of all hitherto existing society is the history of class struggles.',
    pullQuoteAttribution: 'Karl Marx & Friedrich Engels, The Communist Manifesto, Section I',
    banHistory: [
      {
        year: 1878,
        entity: 'German Imperial Government under Bismarck',
        country: 'Germany',
        reasonGiven:
          "The Anti-Socialist Laws (Sozialistengesetze) banned socialist organizations, meetings, and publications, of which the Manifesto was the foundational text.",
        action: 'Banned and suppressed throughout the German Empire.',
        outcome:
          'The laws were repealed in 1890 but accelerated the international spread of socialist organizing rather than stopping it.',
      },
      {
        year: 1950,
        entity: 'U.S. State Department / Post Office',
        country: 'United States',
        reasonGiven:
          'During McCarthyism, communist literature was treated as seditious. The Manifesto was flagged by the House Un-American Activities Committee.',
        action:
          'Copies were seized at ports of entry; possession was used as evidence of Communist Party membership in loyalty investigations.',
        outcome:
          'The Supreme Court eventually ruled that mere possession of political literature was protected under the First Amendment.',
      },
      {
        year: 2010,
        entity: 'Various school boards',
        country: 'United States',
        reasonGiven:
          'Challenged as promoting communism and anti-American values; labeled ideological propaganda rather than educational material.',
        action: 'Challenged for removal from school curricula in several states.',
        outcome:
          'Most challenges unsuccessful; the text is widely used in history, economics, and political science courses.',
      },
    ],
    authorBio: {
      born: 'May 5, 1818, Trier, Prussia (now Germany)',
      died: 'March 14, 1883, London, England',
      nationality: 'German (stateless in later life)',
      era: 'Victorian / Industrial Age',
      otherWorks: ['Das Kapital (Capital)', 'The German Ideology', 'Economic and Philosophic Manuscripts of 1844', 'The Eighteenth Brumaire of Louis Bonaparte'],
      politicalContext: `Karl Marx wrote the Manifesto in Brussels in six weeks during the winter of 1847–48, commissioned by the Communist League, a workers' organization he and Friedrich Engels had transformed from a utopian discussion club into a disciplined political body. He was twenty-nine years old, already twice exiled — from Prussia for his journalism, from France for his politics — and living on money borrowed from Engels, whose inherited stake in his father's Manchester cotton mills would finance Marx's intellectual project for the rest of his life.

The Europe of 1848 was a pressure cooker. Industrialization had created an urban proletariat of staggering misery — the Manchester slums Engels documented in The Condition of the Working Class in England were typical of every major industrial city. The old aristocratic order was visibly decaying, the new bourgeois order was visibly brutal, and revolutionary nationalism was stirring across the continent. The Manifesto was published in February 1848; within weeks, revolutions had broken out in France, Germany, Austria, Hungary, and Poland.

Marx spent the rest of his life in London, exiled from every European country he might reasonably have lived in, working in the British Museum reading room on Das Kapital — the massive theoretical work that the Manifesto was a prelude to. He lived in poverty, watched several of his children die of diseases of privation, and depended on Engels's financial support to survive. He died in 1883 having never seen a successful workers' revolution, though the Paris Commune of 1871 briefly electrified him.

The irony of the Manifesto's afterlife is that the revolutions it inspired — Russian, Chinese, Cuban, Vietnamese — bore little resemblance to what Marx actually predicted. He expected revolution to come first in the most industrially developed countries (Germany, Britain, France), not in agrarian Russia or China. The authoritarian regimes that claimed his name in the 20th century built systems he would likely have subjected to withering critique.`,
    },
    whyDangerous: `The Communist Manifesto is dangerous because it performs, in twenty-three pages, the most consequential reframing of political reality in modern history. Before Marx and Engels, the standard explanation for why some people were rich and others poor was essentially theological: God's will, natural hierarchy, the deserved rewards of virtue and industry. The Manifesto replaced this with a materialist analysis: wealth and poverty are produced by specific economic arrangements, those arrangements serve specific class interests, and those interests are maintained by political power, law, religion, and culture.

This reframing is dangerous not because it is wrong — most historians accept some version of its core argument — but because it is clarifying in a way that power finds intolerable. If poverty is not God's will but the product of an exploitative economic system, then the exploited have not only a right but a duty to change that system. If law and religion are, in part, instruments of class domination, then loyalty to them is a form of complicity. These conclusions, once you accept the analysis, are almost inescapable.

The Manifesto is also dangerous because it is magnificently written. "A specter is haunting Europe" — the opening line functions as a Gothic invocation, as rhetoric, as political analysis simultaneously. Engels said it read like a poem. The prose has a kinetic energy that makes the political philosophy feel like destiny, which is either its great achievement or its great danger, depending on where you stand.`,
    whatBanReveals: `The systematic suppression of the Manifesto across the 20th century — by Nazi Germany, Fascist Italy, Francoist Spain, Imperial Japan, McCarthyite America, and every authoritarian regime that ever felt threatened by organized labor — reveals something the suppressors would prefer not to acknowledge: they were all essentially proving its central thesis. If the ideas in the book were simply wrong, suppressing them would be unnecessary. You don't ban mathematics textbooks.

The American experience is particularly instructive. The United States, whose founding documents assert the right of workers to life, liberty, and the pursuit of happiness, spent the entire Cold War treating a twenty-three-page pamphlet as an existential threat. People lost jobs, were imprisoned, had their passports revoked, and were destroyed by political persecution for possessing or distributing a text that described the exploitation of workers in industrial capitalism — exploitation that any working person in 1950 could observe directly.

What the bans reveal, finally, is the gap between official ideology and material reality that the Manifesto diagnoses. In a society where everyone genuinely had equal opportunity and where labor was fairly compensated, the Manifesto's critique would be toothless. The vigor of the suppression has always been proportional to the accuracy of the critique.`,
    whyReadIt: `Read the Manifesto because it is one of the most influential twenty-three pages ever written, and you cannot understand the 20th century without understanding it. Two-thirds of the world's population lived under governments that claimed to be based on its principles, for better (and mostly) for worse. The Cold War, decolonization, the labor movement, the welfare state — all of these are responses to or consequences of the ideas in this document.

Read it because it asks a question that has not been answered: is a form of capitalism possible that does not systematically exploit labor and concentrate wealth? The answer the 21st century is producing — increasing automation, stagnant wages, extreme inequality, environmental catastrophe — suggests the question is at least as urgent as it was in 1848.

Read it critically, with full knowledge of the catastrophic experiments conducted in its name. Marx's analysis of capitalism has proved considerably more durable than his predictions about revolution. Understanding where he was right and where he was wrong requires actually reading what he wrote rather than relying on either his disciples' hagiographies or his critics' caricatures.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Section I: Bourgeois and Proletarians',
        paragraphIndex: 1,
        label:
          '"The history of all hitherto existing society..." — the opening that reframes all of human history as class struggle.',
      },
      {
        chapterTitle: 'Section II: Proletarians and Communists',
        paragraphIndex: 12,
        label:
          'The ten immediate demands — the specific political program that governments worldwide have spent 175 years enacting, opposing, or negotiating.',
      },
      {
        chapterTitle: 'Section IV: Position of the Communists',
        paragraphIndex: 3,
        label: '"Workers of the world, unite!" — the final exhortation, the most famous closing in political literature.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 6. MADAME BOVARY — Gustave Flaubert, 1857
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'madame-bovary',
    title: 'Madame Bovary',
    onChainTitle: 'Madame Bovary',
    author: 'Gustave Flaubert',
    yearWritten: 1857,
    nationality: 'French',
    era: '19th Century',
    genre: ['Literary Fiction', 'Realism'],
    coverColor: '#7c2d12',
    pullQuote:
      'She wanted to die, but she also wanted to live in Paris.',
    pullQuoteAttribution: 'Gustave Flaubert, Madame Bovary, Part One',
    banHistory: [
      {
        year: 1857,
        entity: 'French Imperial Government — Prosecutor Ernest Pinard',
        country: 'France',
        reasonGiven:
          'The novel was prosecuted for outrage aux bonnes mœurs (offense against public morality) and offense against religion. Specific passages depicting adultery, Emma\'s suicide, and the "irreverent" last rites were cited.',
        action:
          "Full criminal trial of Flaubert, his publisher Michel Lévy, and the printer. Flaubert faced potential imprisonment. The trial was public and extensively covered.",
        outcome:
          "Acquittal on all charges, February 7, 1857. The trial generated enormous publicity. The novel, serialized in the Revue de Paris in 1856, became a sensation on publication as a book. The same prosecutor Pinard would later successfully prosecute Baudelaire's 'Flowers of Evil' that same year.",
      },
      {
        year: 1864,
        entity: 'Congregation of the Index',
        country: 'Vatican',
        reasonGiven: "Added to the Index Librorum Prohibitorum for its 'immorality' and corrosive effect on religious sentiment.",
        action: 'Listed on the Index of Forbidden Books.',
        outcome: "The Church's ban had minimal practical effect; the novel was already a European sensation.",
      },
    ],
    authorBio: {
      born: 'December 12, 1821, Rouen, France',
      died: 'May 8, 1880, Croisset, France',
      nationality: 'French',
      era: 'Realism',
      otherWorks: [
        'Salammbô',
        'A Sentimental Education',
        'The Temptation of Saint Anthony',
        'Three Tales',
        'Bouvard and Pécuchet',
      ],
      politicalContext: `Gustave Flaubert grew up in Rouen, the son of a surgeon — an upbringing that gave him his clinical eye and his capacity for dispassion. He was epileptic, a condition that forced him to abandon a law career in Paris and retreat to the family estate at Croisset, where he would spend most of his life in hermit-like dedication to prose. He wrote Madame Bovary over five years (1851–56), reportedly spending weeks on a single page, pursuing what he called le mot juste — the exactly right word.

France under Napoleon III was a society of suppressed desires and inflated pretensions, a bourgeois empire that celebrated material comfort while enforcing a suffocating public morality. Flaubert loathed the bourgeoisie with the intensity that only a member of the class can achieve — his notebooks are full of what he called the sottisier, his collection of bourgeois clichés and received ideas. Madame Bovary is, among other things, a dissection of how romantic novels corrupt their readers by providing models of desire that real life cannot satisfy.

The irony of the prosecution is that it demonstrated Flaubert's thesis: the French bourgeoisie, unable to recognize its own ridicule, responded to the novel's satire by confirming every satirical point it made. The trial's prosecutor argued that Emma was dangerous because women might imitate her; Flaubert could have noted that this was precisely what he had predicted.

Flaubert remained in Croisset for most of his life, corresponding with his lover Louise Colet, his niece Caroline, and his friends Turgenev and the Goncourts. He died of a cerebral hemorrhage in 1880, leaving his last novel Bouvard and Pécuchet unfinished.`,
    },
    whyDangerous: `Madame Bovary is dangerous because it is so precisely calibrated an autopsy of self-deception that readers cannot help recognizing themselves. Emma Bovary is not a monster or a saint but a woman whose desires outrun her circumstances — shaped by romantic novels into longing for a life that provincial Normandy cannot supply, she fills the gap with adultery, debt, and finally arsenic. The novel's danger is that it implicates readers who find her comprehensible, which is most readers.

The novel is also dangerous because its prose style is itself an argument. Flaubert's famous free indirect discourse — his technique of rendering his characters' thoughts in a narrative voice so close to the character's own that the boundary between narrator and character dissolves — means that readers inhabit Emma's romantic delusions from the inside. We don't observe her foolishness from a safe ironic distance; we experience it as she does, which makes the indictment more powerful and more uncomfortable.

The court in 1857 understood this when it argued that the novel lacked "one single character who could make her blush for her misconduct." What they meant was that the novel refused the moral architecture of didactic fiction — the Good Character who demonstrates the better path. Without that architecture, the novel felt like endorsement. It was actually something more radical: a refusal to judge, which placed the reader's moral faculties in direct contact with the material, without authorial mediation.`,
    whatBanReveals: `The prosecution of Madame Bovary reveals the French Imperial government's investment in controlling the moral imagination of the bourgeoisie — not the working class, notably, but the educated middle class whose fidelity to the social order was essential to the Second Empire's stability. The obscenity law invoked was not about protecting children or the uneducated; it was about what respectable people were permitted to read and think.

The acquittal reveals something equally interesting: that in 1857 France, the legal system was not yet entirely captured by the government's cultural agenda, and that an eloquent defense of artistic freedom by a skilled advocate could prevail. Flaubert's lawyer, Marie-Antoine Jules Sénard, argued that the novel was a moral work because it showed the consequences of immorality — a somewhat ironic defense for a novel that Flaubert explicitly structured to avoid moral editorializing, but effective.

The Vatican's inclusion of the novel on the Index in 1864 reveals a different concern: not sexual morality so much as the corrosive effect of naturalistic fiction on religious faith. A novel that looks at human life with the cold precision of a surgeon and finds no providential design, no moral order, no redemptive grace — only the mechanical operation of desire and consequence — is an argument against theism more effective than any philosophical treatise.`,
    whyReadIt: `Read Madame Bovary because it invented the modern novel. The techniques Flaubert perfected — free indirect discourse, prose rhythm as a bearer of meaning, the refusal of authorial moral commentary — are the techniques that Henry James, James Joyce, Virginia Woolf, and the entire 20th-century tradition built upon. To read Madame Bovary is to read the code that underlies the software of modern fiction.

Read it for the prose, which remains extraordinary in French and remarkable even in translation. The agricultural fair scene, in which Emma and Rodolphe's seduction is intercut with the prize-giving for best livestock — creating a devastating ironic counterpoint that neither character notices — is one of literature's great set pieces. Flaubert was the first writer to use novelistic structure as a form of argument.

Read it because Emma Bovary is still alive. The particular pathology she embodies — the gap between the life imagination offers and the life reality provides, the way consumer culture (then, romantic novels; now, social media) manufactures desire for things that real life cannot supply — has not become less relevant. If anything, in the age of curated aspirational identity, she is more alive than ever.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Part Two, Chapter VIII',
        paragraphIndex: 6,
        label:
          'The Comices Agricoles scene — Rodolphe seduces Emma against the backdrop of the prize livestock; Flaubert\'s masterclass in ironic juxtaposition.',
      },
      {
        chapterTitle: 'Part One, Chapter VI',
        paragraphIndex: 3,
        label:
          "Emma's convent reading — the origin of her romantic delusions, the novels-within-the-novel that formed her impossible expectations.",
      },
      {
        chapterTitle: 'Part Three, Chapter VIII',
        paragraphIndex: 5,
        label:
          "Emma's death by arsenic — the most clinical and devastating ending in 19th-century fiction.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 7. CANDIDE — Voltaire, 1759
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'candide',
    title: 'Candide',
    onChainTitle: 'Candide',
    author: 'Voltaire',
    yearWritten: 1759,
    nationality: 'French',
    era: '18th Century and Earlier',
    genre: ['Satire', 'Philosophical Tale', 'Enlightenment'],
    coverColor: '#6b2d2d',
    pullQuote:
      "We must cultivate our garden.",
    pullQuoteAttribution: 'Voltaire, Candide, Chapter XXX',
    banHistory: [
      {
        year: 1759,
        entity: 'Geneva Council of State',
        country: 'Switzerland',
        reasonGiven:
          'Condemned as contrary to religion and morals; the Geneva authorities were offended by the novel\'s mockery of Calvinist clergy and its pessimistic view of divine providence.',
        action:
          'Burned publicly in Geneva within weeks of publication. Voltaire initially denied authorship.',
        outcome:
          'The burning ensured the novel\'s fame. Multiple unauthorized editions circulated throughout Europe within months.',
      },
      {
        year: 1762,
        entity: 'Paris Parlement',
        country: 'France',
        reasonGiven:
          'Subversive of religion and good morals; the novel\'s satire of the Lisbon earthquake, the Inquisition, and Leibnizian optimism was deemed blasphemous.',
        action: 'Condemned and ordered burned. Voltaire was already in exile at Ferney, beyond French jurisdiction.',
        outcome:
          'The Parisian condemnation, like the Genevan burning, functioned primarily as advertising. Candide became the most widely circulated French prose work of the 18th century.',
      },
      {
        year: 1929,
        entity: 'U.S. Customs Service',
        country: 'United States',
        reasonGiven: 'Sexual content and obscenity — specifically the episodes involving Cunégonde and the Old Woman.',
        action: "Copies of Candide were seized at customs. The United States banned the import of Voltaire's novel — a 170-year-old Enlightenment classic — on obscenity grounds.",
        outcome:
          "The ban was lifted after protests from literary organizations. The episode became a celebrated example of American censorship's absurdity.",
      },
    ],
    authorBio: {
      born: 'November 21, 1694, Paris, France',
      died: 'May 30, 1778, Paris, France',
      nationality: 'French',
      era: 'Enlightenment',
      otherWorks: [
        'Zadig',
        'Letters on the English',
        'Philosophical Dictionary',
        'Micromégas',
        'Treatise on Tolerance',
      ],
      politicalContext: `François-Marie Arouet, who published under the name Voltaire, was the Enlightenment's most dangerous weapon: a genius with a gift for mockery. Born into the Parisian bourgeoisie, educated by Jesuits who recognized and couldn't quite contain his intelligence, he was imprisoned in the Bastille twice before he was thirty — first for satirizing the Regent, second for an altercation with the Chevalier de Rohan, who had him beaten and then used connections to have him imprisoned again rather than face a duel. Voltaire absorbed the lesson: in ancien régime France, the powerful could act with impunity, and the law protected the aristocracy, not justice.

He spent three years in England (1726–29), encountering Newtonian science, Lockean political philosophy, and religious toleration for the first time, and returned to France a convert to the Enlightenment program. His Letters on the English, comparing English liberty favorably to French tyranny, was burned in Paris. He retreated to the estate at Cirey with his lover Émilie du Châtelet, the brilliant mathematician who translated Newton's Principia into French, and spent the next decade in intensive scientific and philosophical work.

Candide was written in three days in late 1758, according to Voltaire's own possibly exaggerated account, prompted by three catastrophes: the Lisbon earthquake of 1755 (which killed 30,000–60,000 people and which Leibnizian optimists attempted to incorporate into their "best of all possible worlds" framework), the Seven Years' War (one of history's most destructive conflicts, fought simultaneously across four continents), and the judicial murder of Admiral Byng by the British government (executed pour encourager les autres — to encourage the others — a phrase Voltaire made immortal in the novel).

Voltaire spent his final years at Ferney, near Geneva but just inside French territory, where he was effectively untouchable — too famous to imprison, too useful to France's international prestige to destroy. He ran Ferney as a model estate, employing hundreds, advocating for victims of judicial injustice, and maintaining an international correspondence that made him the most connected intellectual in Europe. He returned to Paris in 1778 at the age of 83, was received with the adulation of a god, and died there, exhausted by triumph.`,
    },
    whyDangerous: `Candide is dangerous because it makes cruelty funny. Voltaire took the philosophical optimism of Leibniz — the doctrine that ours is "the best of all possible worlds," that God has arranged everything for the best — and subjected it to a sustained, vicious satirical assault by the simple method of describing the actual world: slavery, the Inquisition, war, rape, natural disaster, judicial murder. The joke is that Pangloss, the Leibnizian philosopher who accompanies Candide through all these catastrophes, never stops explaining why everything is for the best.

The laughter this produces is deeply subversive. To laugh at Pangloss is to laugh at the theodicy — the theological argument that divine goodness is compatible with human suffering — that the Church used to explain why God permitted evil. If theodicy is ridiculous, then the Church's comfort is hollow, and the consolation of religion dissolves into farce. Voltaire understood that satire could go where argument couldn't: a philosophical refutation of theodicy requires a philosophical response, but a really good joke about it is impossible to answer.

The danger extends to politics. The kings, generals, aristocrats, and inquisitors who appear in Candide are uniformly absurd or monstrous, and they occupy a world in which rank and power bear no relationship to intelligence, virtue, or wisdom. This was an accurate portrait of 18th-century Europe, which is precisely why every institution of that Europe — Catholic Church, Genevan Calvinist council, French Parlement — moved to suppress it.`,
    whatBanReveals: `The speed of the Genevan burning — weeks after publication — reveals how rapidly Enlightenment texts could circulate and how quickly authorities recognized their danger. The unauthorized editions that proliferated immediately after the burning reveal the corollary: that burning books in the 18th century, before modern communications infrastructure, was essentially impossible to make stick. Books were easily reprinted, easily transported, and the burning itself was better advertising than anything Voltaire could have arranged.

The 1929 American seizure of Candide at customs reveals a particularly poignant irony: a nation that had built its founding ideology partly on Enlightenment principles — on Voltaire, Locke, and Montesquieu — had by 1929 become frightened enough of an 18th-century satirical tale to confiscate it at the border. The Comstock laws that authorized this censorship were themselves a species of the sanctimonious moral hypocrisy that Voltaire spent his life attacking.

What both bans share is the recognition by authorities that Voltaire's mockery, because it was so effective and so funny, could not be answered by argument. When you cannot refute a satirist, you burn the book. This is a kind of tribute to the power of wit.`,
    whyReadIt: `Read Candide because it is the funniest serious book ever written in French, and possibly in any language. In less than one hundred pages, Voltaire manages to satirize Leibnizian optimism, the Jesuits, the Inquisition, aristocratic pretension, colonial slavery, religious intolerance, and European political absurdity, while maintaining a narrative momentum that makes it genuinely hard to put down. It reads like a fever dream, or like the news, which may be the same thing.

Read it for the ending: "We must cultivate our garden." After all the catastrophes Candide has witnessed and survived — war, earthquake, Inquisition, shipwreck, slavery — this is what he concludes. Not hope, not despair, not the theodicy of Pangloss or the pessimism of Martin, but the simple, radical act of tending to the immediate. This conclusion has been read as quietism, as pragmatism, as wisdom, as defeat. Its ambiguity is its power.

Read it because the world Voltaire describes — in which irrational power causes enormous suffering, in which official explanations of suffering are obviously false, in which the ordinary person can neither understand nor control the forces that shape their life — has not been superseded by the world we now inhabit. The names have changed. The situation is recognizable.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter I',
        paragraphIndex: 2,
        label:
          "Pangloss's opening exposition of the 'best of all possible worlds' doctrine — Voltaire establishes the thesis he will spend the novel destroying.",
      },
      {
        chapterTitle: 'Chapter XIX',
        paragraphIndex: 1,
        label:
          'The encounter with the mutilated slave in Surinam — the most devastating passage in the novel, and one of literature\'s great anti-slavery arguments.',
      },
      {
        chapterTitle: 'Chapter XXX',
        paragraphIndex: 8,
        label:
          '"We must cultivate our garden" — the novel\'s famous final line, still debated by philosophers and readers.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 8. THE JUNGLE — Upton Sinclair, 1906
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'the-jungle',
    title: 'The Jungle',
    onChainTitle: 'The Jungle',
    author: 'Upton Sinclair',
    yearWritten: 1906,
    nationality: 'American',
    era: '20th Century',
    genre: ['Muckraking', 'Social Realism', 'Political Fiction'],
    coverColor: '#1e3a5f',
    pullQuote:
      "They had set out to destroy competition, but in the end competition had destroyed them.",
    pullQuoteAttribution: 'Upton Sinclair, The Jungle, Chapter XXVI',
    banHistory: [
      {
        year: 1956,
        entity: 'East German censors',
        country: 'East Germany',
        reasonGiven:
          'Paradoxically banned by the Communist government because Sinclair\'s unsparing critique of capitalism was deemed potentially destabilizing — readers might apply its logic to socialist bureaucracies as well.',
        action: 'Restricted from widespread distribution.',
        outcome:
          'The ban illustrated the perverse logic of authoritarian censorship: a socialist novel banned by a socialist state because its critique was too universal.',
      },
      {
        year: 1906,
        entity: 'Meat-packing industry lobbying',
        country: 'United States',
        reasonGiven:
          "The Beef Trust mounted an intense lobbying and publicity campaign to discredit Sinclair's findings and suppress the novel's influence.",
        action:
          "The industry hired investigators to 'refute' the novel; President Roosevelt initially dismissed Sinclair as a 'crackpot' before the public outcry forced him to commission an independent investigation.",
        outcome:
          "The Reynolds-Neill Report largely confirmed Sinclair's findings. The Pure Food and Drug Act and the Federal Meat Inspection Act were signed into law in June 1906 — perhaps the most concrete legislative consequence of any American novel.",
      },
    ],
    authorBio: {
      born: 'September 20, 1878, Baltimore, Maryland',
      died: 'November 25, 1968, Bound Brook, New Jersey',
      nationality: 'American',
      era: 'Progressive Era',
      otherWorks: [
        'Oil!',
        'Boston',
        'King Coal',
        'The Brass Check',
        'Dragon\'s Teeth (Pulitzer Prize, 1943)',
      ],
      politicalContext: `Upton Sinclair was the most prolific and controversial muckraker of the Progressive Era, a socialist from early adulthood who believed literature was a form of political action. He wrote The Jungle as an undercover investigation — he spent seven weeks in the Chicago stockyards in 1904, talking to workers, observing conditions, and building the portrait of immigrant labor that would become the novel's documentary backbone.

Sinclair's political context was the Gilded Age's transition into the Progressive Era: the consolidation of monopoly capitalism (the "trusts"), the massive immigration from Eastern and Southern Europe, the labor movement's growth under brutal suppression, and the emergence of investigative journalism as a democratic force. The Chicago stockyards he investigated were not incidental to American capitalism but its apotheosis: a vertically integrated, mechanized system for converting living animals into commodity meat, operated on the bodies of immigrant workers who had no legal protections and no political voice.

The novel was rejected by five publishers before appearing serially in the socialist newspaper Appeal to Reason in 1905 and in book form in 1906. Sinclair had intended it as a novel about immigrant labor exploitation; he was bitterly aware that the public response focused almost entirely on the food contamination passages. "I aimed at the public's heart," he said, "and by accident I hit it in the stomach."

Sinclair was politically active for his entire long life — he ran for Governor of California in 1934 on the EPIC (End Poverty in California) platform and came within a few points of winning in a campaign of extraordinary viciousness, a preview of modern political smear tactics. He lived to ninety, outlasting most of the political causes he championed.`,
    },
    whyDangerous: `The Jungle is dangerous because it showed Americans exactly what was in their sausages — and then pointed out that the men who made the sausages were treated worse than the pigs. The food contamination passages produced a public health scandal, but Sinclair's actual subject was the labor contamination: the way capitalism processed human beings through an industrial system that ground them down and spat them out, leaving nothing of value behind.

The novel's danger to the meat-packing industry was direct and measurable: the Pure Food and Drug Act of 1906 is a direct legislative response to the public outcry. But the danger Sinclair intended — the socialist argument that the entire industrial system was built on the exploitation of immigrant labor — proved harder for the public to process. Americans were disturbed by rat droppings in their luncheon meat; they were less ready to conclude that the solution was a workers' state.

The East German ban reveals the book's deepest danger: a systemic critique of industrial exploitation cannot be contained within ideological borders. If capitalism's logic degrades workers, so does actually-existing socialism's bureaucratic command economy. The critique escapes its intended target.`,
    whatBanReveals: `The meat industry's lobbying campaign against The Jungle reveals that when legal censorship isn't available, economic power will attempt to achieve the same result through reputation destruction and organized disinformation. The campaign against Sinclair in 1906 is a template for the industry-funded "science" campaigns that would later be mounted against research on tobacco, asbestos, lead, and climate change. Sinclair's novel is an early case study in how powerful economic interests respond to unflattering accurate reporting.

Roosevelt's initial dismissal of Sinclair as a "crackpot" and his eventual reversal under public pressure reveals the political dynamics of the Progressive Era: reform was possible, but only when public pressure was strong enough to overcome industry lobbying. The novel created that pressure. The Pure Food Acts passed. But the labor reforms Sinclair actually wanted — worker ownership, socialist reorganization of production — went nowhere. The public was willing to regulate the food supply; it was not yet ready to question the economic system.

The East German ban, meanwhile, reveals the anxiety of authoritarian systems about universally applicable critique. A socialist novel that criticizes capitalist exploitation poses a question that socialist governments cannot answer: what prevents the same logic from applying here?`,
    whyReadIt: `Read The Jungle because it demonstrates, more clearly than almost any other American novel, the political power of documentary fiction. Sinclair spent seven weeks in the stockyards gathering material; the result was legislation that changed American food safety law permanently. The model — of the writer as investigator, of fiction as a vehicle for investigative journalism — remains one of literature's most powerful possibilities.

Read it for Jurgis Rudkus, the Lithuanian immigrant protagonist, whose arc from hopeful arrival to broken despair is one of the most thorough portrayals of what industrial capitalism does to a human body and spirit. The novel refuses the consolation of individual triumph; Jurgis does not succeed by working harder. The system grinds him down regardless of effort, because the system is designed to do exactly that.

Read it knowing that the food safety protections it generated have partially eroded, that meat-packing plants still rely on immigrant labor under brutal conditions, and that the gap between the America Jurgis hoped to find and the America he found is still very much with us. The Jungle has not been superseded. It has been temporarily forgotten.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter II',
        paragraphIndex: 4,
        label:
          "The wedding feast — Jurgis's hopeful arrival in Chicago, the America he dreams of contrasted with the reality he will encounter.",
      },
      {
        chapterTitle: 'Chapter XIV',
        paragraphIndex: 2,
        label:
          'The passage describing the contents of packaged meat — the lines that produced a public health scandal and moved Congress to act.',
      },
      {
        chapterTitle: 'Chapter XXVIII',
        paragraphIndex: 1,
        label:
          "Jurgis's conversion to socialism — the novel's most contested passage, which reviewers called crude propaganda and which Sinclair considered its point.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 9. GULLIVER'S TRAVELS — Jonathan Swift, 1726
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'gullivers-travels',
    title: "Gulliver's Travels",
    onChainTitle: "Gulliver's Travels",
    author: 'Jonathan Swift',
    yearWritten: 1726,
    nationality: 'Anglo-Irish',
    era: '18th Century and Earlier',
    genre: ['Satire', 'Political Allegory', 'Travel Writing'],
    coverColor: '#6b2d2d',
    pullQuote:
      'I cannot but conclude the bulk of your natives to be the most pernicious race of little odious vermin that nature ever suffered to crawl upon the surface of the earth.',
    pullQuoteAttribution: "Jonathan Swift, Gulliver's Travels, Part II, Chapter VI (King of Brobdingnag's verdict on humanity)",
    banHistory: [
      {
        year: 1726,
        entity: 'Publisher Benjamin Motte',
        country: 'England',
        reasonGiven:
          "Motte altered the manuscript before publication without Swift's consent, removing or softening passages he deemed too politically dangerous — particularly material critical of the English government and the Whig administration.",
        action:
          'Unauthorized editorial censorship before first publication. Swift did not see the true first edition until friends sent him a copy.',
        outcome:
          "Swift was furious but could do nothing. The unexpurgated version was not restored until 1735, published in Dublin by George Faulkner under Swift's supervision.",
      },
      {
        year: 1726,
        entity: 'British government officials',
        country: 'England',
        reasonGiven:
          "The political allegory was too transparent — Walpole's government could identify themselves in the Lilliputian court and the Laputian flying island. Several officials urged prosecution.",
        action: 'Prosecution was considered but not pursued, as the author was anonymous and prosecution would confirm the political readings.',
        outcome:
          "The government decided that prosecuting the book would draw more attention to its satire. Swift maintained plausible deniability; the book was attributed to 'Lemuel Gulliver' on the title page.",
      },
      {
        year: 1900,
        entity: 'School libraries and publishers',
        country: 'United States / Britain',
        reasonGiven:
          "Parts III and IV deemed too political, too obscene, or too disturbing for children; the Yahoo episode was considered degrading to human dignity.",
        action:
          'Abridged "children\'s editions" became the standard text in schools, stripping the political satire and retaining only the fantasy adventure of Parts I and II.',
        outcome:
          "The reduction of a savage political satire to a children's adventure story became standard, fundamentally misrepresenting Swift's intentions.",
      },
    ],
    authorBio: {
      born: 'November 30, 1667, Dublin, Ireland',
      died: 'October 19, 1745, Dublin, Ireland',
      nationality: 'Anglo-Irish',
      era: 'Augustan / Enlightenment',
      otherWorks: [
        'A Modest Proposal',
        'A Tale of a Tub',
        'The Battle of the Books',
        'Journal to Stella',
        'Drapier\'s Letters',
      ],
      politicalContext: `Jonathan Swift was born in Dublin to English parents seven weeks after his father's death, raised in poverty by an uncle, educated at Trinity College Dublin, and spent his life in the uncomfortable position of an Englishman in Ireland and an Irishman in England — belonging fully to neither, bitter about both. He served as secretary to the diplomat Sir William Temple for years, absorbing the frustrations of political life at close quarters. In 1713 he was made Dean of St. Patrick's Cathedral in Dublin, a posting he considered an exile — he had expected a more prestigious English living.

Swift's political career, such as it was, ended with the death of Queen Anne in 1714 and the rise of the Whigs under the Hanoverian succession. He had been the Tory government's most effective propagandist, writing The Conduct of the Allies, The Examiner, and other pamphlets that helped shape public opinion; when the Tories fell, Swift fell with them. He spent the rest of his life in Dublin, channeling his political bitterness into the most savage literary satire in the English language.

His Irish patriotism was reluctant — he claimed to love Ireland only as a man might love his chains — but genuine. The Drapier's Letters (1724), a campaign against Wood's halfpence (a scheme to flood Ireland with debased copper coinage for private profit), were the most effective pieces of political journalism of the century, and Swift was for a time the most popular man in Dublin. A Modest Proposal (1729), his proposal to eat Irish babies as a solution to Irish poverty, remains the definitive example of sustained ironic argument in English.

Swift suffered in his final years from what was likely Ménière's disease — vertigo, deafness, and possibly dementia — and was declared of unsound mind and incapable of self-care in 1742. He died in 1745 and left most of his estate to found a hospital for the mentally ill in Dublin, with the epitaph he wrote for himself: "He has gone where savage indignation can lacerate his heart no more."`,
    },
    whyDangerous: `Gulliver's Travels is dangerous because it performs its politics through scale. In Lilliput, European politics are revealed as petty quarrels over which end of an egg to crack; the Lilliputians' contemptible vanity is recognizable as the vanity of English court politics. In Brobdingnag, Gulliver's pride in English civilization is reduced to absurdity when a king with genuine perspective pronounces England's political system a nursery of corruption. In the land of the Houyhnhnms, human beings — Yahoos — are revealed as violent, selfish, and irrational beneath their pretensions of reason.

The progression of the four books is a systematic destruction of human self-flattery. Swift spares nothing: religion, science, philosophy, politics, colonial expansion, patriotism — all are subjected to the same relentless satirical gaze. What remains at the end is not nihilism but rage: Swift's "savage indignation" at the gap between human pretension and human behavior.

The sanitization into a children's adventure story is perhaps the most effective act of censorship Swift's work has suffered. By stripping the political allegory and keeping only the fantasy adventures of Parts I and II, generations of readers have grown up knowing "Gulliver's Travels" as a whimsical tale about small people and giants rather than as one of literature's most savage political indictments.`,
    whatBanReveals: `Motte's pre-publication censorship reveals the publisher's role in self-censorship under political pressure: even before governments ban books, printers and publishers — who are exposed to legal and financial consequences — internalize censorious logic and excise material on government's behalf. This is still the most common form of censorship, and Swift's experience of finding his manuscript altered without his consent has been repeated countless times.

The government's decision not to prosecute, meanwhile, reveals a calculated judgment that suppression would amplify rather than silence. This calculation — that censorship draws more attention to the censored material than it suppresses — was already understood in the 18th century, though governments have often ignored it when political pressure demanded a visible response.

The children's edition transformation reveals the most insidious form of censorship: the reduction of complex, dangerous work to a harmless genre product. By recasting Swift's political satire as a children's adventure, publishers and schools preserved the commercial product while neutralizing the political content. This kind of censorship leaves the title in circulation while suppressing the work's actual meaning.`,
    whyReadIt: `Read Gulliver's Travels in full — all four books, in an unabridged edition — because the first two parts are a magnificent setup for the devastation of the final two. The transition from the charming adventures of Lilliput and Brobdingnag to the desolate Houyhnhnm-land of Part IV is one of literature's great tonal shifts: a book that seemed to be one thing reveals itself to be something far darker and more demanding.

Read it for A Modest Proposal, which is included in some editions, and read that with full awareness that Swift is proposing to literally eat Irish babies and meaning every ironic word of it. The gap between the rational, reasonable tone and the monstrous proposal is where Swift's politics live: he is showing you what English colonial policy toward Ireland amounts to, stripped of its justifications.

Read it, finally, as a challenge to the idea that civilization progresses. Swift thought history was circular and human nature fixed; his satire is written from the certainty that the follies he observed in 1726 would be recognizable in any era. He was right. The Laputians, obsessed with abstract theory and incapable of practical action, are still with us. So are the Yahoos.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Part I, Chapter VI',
        paragraphIndex: 4,
        label:
          "Gulliver's description of European politics to the Lilliputians — Swift's satirical portrait of parliamentary debate as a quarrel about egg-cracking.",
      },
      {
        chapterTitle: 'Part II, Chapter VI',
        paragraphIndex: 7,
        label:
          "The King of Brobdingnag's verdict on England — 'the most pernicious race of little odious vermin' — the satirical climax of the first two parts.",
      },
      {
        chapterTitle: 'Part IV, Chapter X',
        paragraphIndex: 3,
        label:
          "Gulliver's expulsion from Houyhnhnm-land and his misanthropy — the novel's darkest conclusion, and its most honest.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 10. THE PRINCE — Niccolò Machiavelli, 1532
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'the-prince',
    title: 'The Prince',
    onChainTitle: 'The Prince',
    author: 'Niccolò Machiavelli',
    yearWritten: 1532,
    nationality: 'Florentine (Italian)',
    era: '18th Century and Earlier',
    genre: ['Political Philosophy', 'Statecraft'],
    coverColor: '#6b2d2d',
    pullQuote:
      'It is better to be feared than loved, if you cannot be both.',
    pullQuoteAttribution: 'Niccolò Machiavelli, The Prince, Chapter XVII',
    banHistory: [
      {
        year: 1559,
        entity: 'Congregation of the Index',
        country: 'Vatican / International',
        reasonGiven:
          "The Prince was placed on the first Index Librorum Prohibitorum ever issued by the Catholic Church. It was condemned for its advocacy of political means divorced from Christian morality, its secular analysis of power, and its implicit argument that religion was a tool of statecraft.",
        action: 'Added to the first Pauline Index. All of Machiavelli\'s works were banned.',
        outcome:
          'The ban enhanced the book\'s prestige throughout Protestant Europe. In England and the Netherlands, where the Papal Index had no force, The Prince circulated freely and was widely read by statesmen.',
      },
      {
        year: 1576,
        entity: 'French Protestant opposition',
        country: 'France',
        reasonGiven:
          "The St. Bartholomew's Day Massacre (1572) was attributed, rightly or wrongly, to Machiavellian counsel. Anti-Machiavellian tracts multiplied; Innocent Gentillet's Contre-Machiavel (1576) blamed Machiavelli for corrupting French politics.",
        action:
          "The 'Machiavel' became a stock theatrical villain in English drama, associated with atheism, murder, and political duplicity.",
        outcome:
          "Marlowe's Jew of Malta and Shakespeare's Richard III bear the 'Machiavel' character as a dramatic type — evidence of how thoroughly the name had become synonymous with evil statecraft.",
      },
    ],
    authorBio: {
      born: 'May 3, 1469, Florence, Italy',
      died: 'June 21, 1527, Florence, Italy',
      nationality: 'Florentine',
      era: 'Renaissance',
      otherWorks: [
        'Discourses on Livy',
        'The Art of War',
        'Florentine Histories',
        'Mandragola (play)',
        'The Life of Castruccio Castracani',
      ],
      politicalContext: `Niccolò Machiavelli served the Florentine Republic as Second Chancellor and Secretary of the Ten of War — effectively its foreign minister and intelligence chief — for fourteen years (1498–1512), during which he observed at close quarters the politics of Renaissance Italy: the Borgias, the Sforzas, Pope Julius II, the French invasions, and the complex dance of Italian city-state politics in which no moral scruples could be assumed of anyone. He met Cesare Borgia three times, watched him operate with the ruthless efficiency that Machiavelli would later analyze in The Prince, and was simultaneously appalled and fascinated.

When the Medici returned to Florence in 1512 with Spanish support and the republic was dissolved, Machiavelli was dismissed from office. In February 1513, he was briefly imprisoned and tortured (strappado — hung by the wrists behind the back) on suspicion of participation in an anti-Medici conspiracy. He had no involvement but confessed nothing. Released under a general amnesty, he retired to his small farm at Sant'Andrea in Percussina and began writing to console himself for the loss of his political career.

The Prince was composed in late 1513 and dedicated to Lorenzo de' Medici — a gift, in effect, from a disgraced republican official to the ruling family that had ended the republic, offering his political knowledge in the hope of obtaining employment. The dedication was never acknowledged. Machiavelli never regained significant political employment under the Medici, though he was eventually given minor commissions.

The Discourses on Livy, written simultaneously with The Prince and largely finished before it, represents Machiavelli's actual political philosophy — a thoroughgoing republicanism that makes The Prince's analysis of princely power look like a necessary detour through political realism. The Discourses are less read than The Prince because they are less scandalous, which is itself a lesson in how canonization works.`,
    },
    whyDangerous: `The Prince is dangerous because it says out loud what political actors have always known and never said: that power operates according to its own logic, which does not automatically align with Christian morality, legal principle, or philosophical justice. The prince who wants to hold power must understand how power actually works — through fear, through spectacle, through strategic cruelty and strategic mercy — rather than how moral philosophy says it should work.

This is not a celebration of immorality but a diagnosis of political reality, and the diagnosis is dangerous because it is accurate. Every political actor who has ever made a "necessary" compromise with ethical principle, who has ever used religion as a tool of social control, who has ever calculated when to project strength and when to project mercy — every such actor has been operating on Machiavellian principles whether or not they have read The Prince. Machiavelli's sin was simply describing this openly.

The "Machiavel" of popular imagination — the scheming, atheistic, conscienceless manipulator — is a caricature that has served the interests of those who found the actual analysis too uncomfortable. If Machiavelli is monstrous, his insights can be dismissed as monstrous. If he is simply a realist describing how power works, then everyone who exercises power must either adopt his analysis or pretend they don't.`,
    whatBanReveals: `The placement of The Prince on the very first Index ever issued reveals what the Church found most threatening: not the specific practical advice about cruelty and mercy, but the book's fundamental premise that politics is an autonomous domain with its own rationality, independent of theological authority. A secular science of politics — one that analyzes power without reference to God's will or Christian virtue — is a science that has no need of clerical oversight or validation. This was the real heresy.

The Protestant reception of the book is revealing in a different way. In England, the Netherlands, and Protestant Germany, where the Papal Index had no force, The Prince was widely read precisely because it offered a secular analysis of power that Protestant rulers — who had just detached themselves from Rome's authority — found useful. The same text that the Church banned as godless, Protestants found practically instructive.

The "Machiavel" caricature that developed in English drama reveals how difficult it is for culture to assimilate an analysis that confirms its worst suspicions about power. The theatrical Machiavel is a villain precisely because making him a villain externalizes and demonizes insights that would otherwise force uncomfortable self-recognition. He is not us, the audience reassures itself. We would not do such things.`,
    whyReadIt: `Read The Prince because it is the founding text of modern political science — the first systematic attempt to analyze politics as a domain with its own rationality rather than as applied ethics. Every subsequent political philosophy, whether it agrees with Machiavelli or argues against him, is in dialogue with his work. Hobbes, Locke, Rousseau, Marx, Weber — they are all responding, directly or indirectly, to the questions The Prince raised.

Read it because it is short, clear, and perpetually startling. The famous passages — on cruelty used well, on the lion and the fox, on the nature of fortune — retain their capacity to shock because they strip away the rhetoric with which power typically disguises itself. Machiavelli writes about power as it is, not as it pretends to be.

Read it alongside the Discourses, which reveals that Machiavelli's full political vision was republican, not tyrannical. The Prince is a tactical manual for holding power in a principality; the Discourses is his preference — for republics, popular participation, and civic virtue. Reading them together reveals a political thinker far more complex and interesting than the cartoon Machiavel who has haunted five centuries of Western culture.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter XV',
        paragraphIndex: 2,
        label:
          '"It is better to be feared than loved" — the passage that made Machiavelli infamous, and that still defines the popular image of realpolitik.',
      },
      {
        chapterTitle: 'Chapter XVIII',
        paragraphIndex: 3,
        label:
          'On the lion and the fox — the two modes of power, force and cunning, and why a prince must know how to be both.',
      },
      {
        chapterTitle: 'Chapter XXV',
        paragraphIndex: 1,
        label:
          'On Fortune — the famous passage comparing Fortune to a river and a woman, one of the Renaissance\'s most distinctive political metaphors.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 11. PARADISE LOST — John Milton, 1667
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'paradise-lost',
    title: 'Paradise Lost',
    onChainTitle: 'Paradise Lost',
    author: 'John Milton',
    yearWritten: 1667,
    nationality: 'English',
    era: '18th Century and Earlier',
    genre: ['Epic Poetry', 'Theology', 'Political Allegory'],
    coverColor: '#6b2d2d',
    pullQuote:
      'Better to reign in Hell, than serve in Heaven.',
    pullQuoteAttribution: 'John Milton, Paradise Lost, Book I, line 263',
    banHistory: [
      {
        year: 1667,
        entity: 'Stationers\' Company censors',
        country: 'England',
        reasonGiven:
          'The poem required licensing before publication under the Licensing Act of 1662. The licenser initially objected to passages in Book I that appeared to analogize the sun\'s eclipse to the King\'s restoration — potentially treasonous allegory.',
        action:
          "License initially withheld; resolved after the offending passages were reviewed and the astronomical description accepted as literally astronomical rather than political.",
        outcome:
          'The poem was eventually licensed and published in 1667. The censors\' concern about political allegory was not unfounded — the poem is saturated with political meaning.',
      },
      {
        year: 1811,
        entity: 'Various school authorities',
        country: 'United States',
        reasonGiven:
          "Satan's rhetoric in Books I-II was considered too persuasive and sympathetic; the poem was accused of making the devil heroic and God tyrannical.",
        action:
          'Challenged in some school contexts for promoting sympathy with Lucifer and potentially undermining orthodox Christianity.',
        outcome:
          "William Blake's famous remark — that Milton was 'of the Devil\'s party without knowing it' — crystallized the ongoing controversy about which side the poem actually endorses.",
      },
    ],
    authorBio: {
      born: 'December 9, 1608, London, England',
      died: 'November 8, 1674, London, England',
      nationality: 'English',
      era: 'Early Modern / Interregnum',
      otherWorks: [
        'Areopagitica',
        'Paradise Regained',
        'Samson Agonistes',
        'Lycidas',
        'Comus',
        'The Tenure of Kings and Magistrates',
      ],
      politicalContext: `John Milton was the most learned man in England and one of its most dangerous political actors. He had written, in 1649, The Tenure of Kings and Magistrates, which argued that kings derived their authority from the people and could be lawfully deposed and executed — published two weeks after Charles I's execution, this was effectively a defense of regicide. He served as Secretary for Foreign Tongues (Latin secretary) under Oliver Cromwell's Commonwealth, writing state documents and defending the regicide to European audiences.

When the Restoration came in 1660 and the monarchy returned, Milton was briefly imprisoned. The Indemnity and Oblivion Act spared most Parliamentarians, but Milton was specifically excluded from protection for his writings. Friends and publishers intervened to save him, and he escaped with a fine and the burning of some of his books. He had gone blind by 1652, and the years of the Restoration were years of defeat, grief (his second wife died, then his third), and the composition of the great works in which he attempted to make sense of what had happened.

Paradise Lost, begun in the 1650s and completed after the Restoration, is not simply a retelling of Genesis. It is a poem about the problem of tyranny and liberty written by a man who had served the only successful republican government in English history, seen it fail, and lived through the return of monarchy. Satan's revolt against God's absolute sovereignty, his famous refusal to serve, his rhetoric of liberty and self-determination — these passages were written by a republican who had spent his career arguing against absolute monarchy, and they carry that weight.

The paradox that has exercised readers for three centuries — is Satan the poem's hero, or its villain? — was perhaps Milton's deliberate design: he needed Satan to be genuinely dangerous, genuinely persuasive, and genuinely wrong. Getting that balance right meant making the case for tyranny powerfully enough that its refutation would be meaningful.`,
    },
    whyDangerous: `Paradise Lost is dangerous because Satan is too good. Milton created in Lucifer a speaker of such magnificent defiance — "Better to reign in Hell, than serve in Heaven" — that readers across the centuries, from Blake to the Romantics to the modern reader, have found themselves moved by the rebel's cause against divine authority. This was Milton's artistic problem: he could not make God's antagonist weak and make God's victory meaningful.

The political allegory underlies the theological surface throughout. Satan's revolt is the revolt of a powerful subordinate against an absolute sovereign who has arbitrarily invested authority in his Son; Adam and Eve's transgression is an act of free will that God permitted but will now punish; the poem's God behaves, at moments, with the arbitrary authority of a Stuart monarch. A poem written by a man who had defended regicide and served a republican government could not entirely suppress those associations even in a poem ostensibly about the Fall of Man.

The deeper danger is the question the poem raises and cannot fully answer: if God foreknew the Fall and permitted it, and if human free will is genuine, how is God not responsible for human suffering? Milton's God provides an answer in Books III and VII, but Satan's implicit counter-argument — that omnipotent sovereignty cannot be reconciled with genuine liberty — has never been fully refuted. The poem is, among other things, a four-hundred-year-old argument about political theology that remains open.`,
    whatBanReveals: `The censors' concern about Milton's astronomical passage reveals how completely political paranoia can distort literary reading. The Restoration government, having just returned from exile after a decade of republican rule, was primed to find political allegory everywhere — and in Milton's case, not without reason. The licensing dispute over Paradise Lost shows the machinery of censorship at its most anxious: a text that might or might not be treasonous, read by officials who can't quite decide whether the author has gotten away with something.

The later controversy over Satan's heroism reveals a different kind of anxiety: the worry that a morally complex portrayal of evil will produce immoral readers. This is the fear that drives much literary censorship — not that a text is false, but that it is too vivid, too persuasive, too capable of making the wrong side sympathetic. Milton's Satan is too good a villain for the comfort of readers who need their moral categories simple and their literary sympathies well-directed.

What the poem's contested reception reveals, across three centuries, is the impossibility of separating aesthetic judgment from political and theological commitments. The readers who see Satan as hero and God as tyrant are reading Milton's politics through his theology; the readers who see Satan as the ultimate villain are reading his theology through their politics. The poem forces the confrontation and refuses to settle it.`,
    whyReadIt: `Read Paradise Lost because it is the most ambitious work in English literature — an epic that attempts to "justify the ways of God to men," to explain original sin, free will, and human suffering within a narrative framework drawn from Genesis. Whether you think it succeeds, fails, or does something more interesting than either, the ambition alone is worth the encounter.

Read it for the language. Milton's blank verse — unrhymed iambic pentameter deployed at epic length — remains the most architecturally impressive English verse ever written. The opening invocation, Satan's first great speech, the Council in Hell, Adam and Eve's farewell — these passages work on you physiologically as well as intellectually, as great poetry always does.

Read it as political history. You are reading a poem written by a man who defended the execution of a king, served a revolutionary government, survived the failure of that revolution, and spent his blind old age trying to make sense of what he had believed and what had gone wrong. The poem is saturated with that history. Every reader of Paradise Lost is also reading the English Revolution.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Book I, Lines 1-26',
        paragraphIndex: 1,
        label:
          "The invocation — Milton announces his ambition to 'justify the ways of God to men' and places himself in the line of Homer and Virgil.",
      },
      {
        chapterTitle: 'Book I, Lines 242-270',
        paragraphIndex: 1,
        label:
          'Satan\'s first great speech — "Better to reign in Hell, than serve in Heaven" — the poem\'s most controversial passage and its most electrifying rhetoric.',
      },
      {
        chapterTitle: 'Book XII, Lines 641-649',
        paragraphIndex: 1,
        label:
          "Adam and Eve's expulsion from Paradise — the poem's final image, 'the world was all before them,' one of literature's great endings.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 12. RIGHTS OF MAN — Thomas Paine, 1791
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'rights-of-man',
    title: 'Rights of Man',
    onChainTitle: 'Rights of Man',
    author: 'Thomas Paine',
    yearWritten: 1791,
    nationality: 'Anglo-American',
    era: '18th Century and Earlier',
    genre: ['Political Philosophy', 'Revolutionary Tract'],
    coverColor: '#6b2d2d',
    pullQuote:
      'My country is the world, and my religion is to do good.',
    pullQuoteAttribution: 'Thomas Paine, Rights of Man, Part Second, Chapter V',
    banHistory: [
      {
        year: 1792,
        entity: 'British Crown — Attorney General Archibald Macdonald',
        country: 'Great Britain',
        reasonGiven:
          'Seditious libel against the King and the British government; the book advocated republicanism and attacked hereditary monarchy, the aristocracy, and the British constitution.',
        action:
          "Paine was tried for seditious libel in absentia — he had already escaped to France where he was elected to the National Convention. Found guilty by a jury in December 1792, Paine was sentenced to outlawry and banned from Britain for life.",
        outcome:
          "The conviction made Paine a hero in radical circles and a martyr for press freedom. The book circulated in cheap editions throughout Britain despite attempts to suppress it; it may have sold 200,000 copies in Britain alone by 1793.",
      },
      {
        year: 1797,
        entity: 'Various state and local authorities',
        country: 'United States',
        reasonGiven:
          "Paine's deism and his attacks on Christianity in The Age of Reason (1794-95) had made him toxic to American religious sensibilities; Rights of Man was increasingly associated with his religious heterodoxy.",
        action:
          'While never formally banned in the United States, Paine was subjected to a campaign of character assassination led by figures including John Adams and Timothy Dwight that effectively drove him from respectable American society.',
        outcome:
          "Paine returned to the United States in 1802 and died in New York in 1809 in poverty and near-total social ostracism, a forgotten man. Only six people attended his funeral. His reputation was rehabilitated only in the 20th century.",
      },
    ],
    authorBio: {
      born: 'February 9, 1737, Thetford, Norfolk, England',
      died: 'June 8, 1809, New York City, New York',
      nationality: 'Anglo-American',
      era: 'Age of Revolution',
      otherWorks: [
        'Common Sense',
        'The American Crisis',
        'The Age of Reason',
        'Agrarian Justice',
      ],
      politicalContext: `Thomas Paine arrived in America from England in November 1774, thirty-seven years old and a failure by the standards of his age — a twice-dismissed excise officer, a failed shopkeeper, a man whose first marriage had ended in widowhood within a year and whose second ended in separation. He carried a letter of introduction from Benjamin Franklin and almost nothing else. Within fourteen months he had written Common Sense, the most influential pamphlet in American history, which sold perhaps 500,000 copies in a population of 2.5 million and made the case for American independence more effectively than any speech or newspaper article.

Paine's genius was political argument in plain English — language that a craftsman could read and an educated gentleman would not condescend to. He had no university education and drew on autodidactic reading, natural philosophy, and a radical dissenting Protestant tradition that believed every man could reason his way to truth. He was not a philosopher in the academic sense; he was a propagandist in the best sense, a man who could translate complex political principles into compelling common language.

Rights of Man was written in response to Edmund Burke's Reflections on the Revolution in France (1790), the great conservative argument that the French Revolution was a catastrophic mistake because it violated the inherited wisdom embodied in tradition and custom. Paine's counter-argument — that every generation has the right to establish the form of government it chooses, that hereditary rights are nonsense, that the only legitimate source of political authority is the consent of the living — was so dangerous to the British establishment that his publisher was prosecuted and Paine himself tried for sedition.

Paine's last years were among the saddest of any great political thinker. His deism, expressed in The Age of Reason, alienated the American religious public that had once revered Common Sense. He died believing himself forgotten, which he was — temporarily. His influence on democratic thought, once recovered, proved incomparably large.`,
    },
    whyDangerous: `Rights of Man is dangerous because it demolishes the theoretical foundation of hereditary aristocracy with a simplicity that makes the argument feel obvious once stated. Paine asks: what gives a king or a lord the right to govern? Not ability — heredity doesn't transmit competence. Not divine authority — no reliable mechanism of divine selection has ever been demonstrated. Not merit — no one has earned their birthright. Only the convenience of those who benefit from the system, maintained by a political arrangement that has been running long enough to seem natural.

This argument, obvious as it sounds, was radical in 1791 because it delegitimized not just the French monarchy but the British constitution, the House of Lords, the principle of hereditary rule everywhere. Paine went further, proposing in Part Second a system of progressive taxation, old-age pensions, public education, and employment provision — a proto-welfare state in 1792, funded by taxing inherited wealth. This was genuinely revolutionary.

The danger was amplified by Paine's prose. Burke's Reflections had been written in the elegant, allusive style of educated English political culture; Paine answered in the language of the tradesman and the dissenter. This democratization of political argument was itself a political act: by writing for everyone rather than for the educated elite, Paine implied that political questions were everyone's business to decide. This was the deepest heresy of all.`,
    whatBanReveals: `The British prosecution of Paine reveals the government's acute awareness that democratic ideas in cheap editions were more dangerous than the same ideas in expensive books that only gentlemen could afford. The prosecution was aimed not just at Paine but at his publisher and at the networks that distributed cheap reprints to working-class readers. The government understood that literacy and cheap print had created a new political public, and that this public, given access to Paine's arguments, might draw uncomfortable conclusions about its own governors.

Paine's American ostracism reveals a different dynamic: the way that religious condemnation can perform the social work of political suppression. The Age of Reason attacked Christian orthodoxy; this provided ammunition for those who wanted to neutralize Paine politically without engaging his political arguments. By making him a godless infidel, his former admirers could disown his politics as the products of a corrupted mind rather than address the arguments themselves.

What both suppressions reveal is that democratic theory, when it reaches a mass audience, is genuinely destabilizing to hierarchical social orders — not because it is wrong, but because it is right. The British government prosecuted Paine because it knew that millions of Britons who read Rights of Man might start wondering why they did not have the rights it described. This fear was correct.`,
    whyReadIt: `Read Rights of Man because it is one of the clearest statements of democratic political philosophy ever written. Paine's argument — that political authority derives from the consent of the governed, that every generation has the right to govern itself, that hereditary privilege is irrational and unjust — is the theoretical foundation of modern democracy, stated with a clarity that later political philosophy has obscured rather than improved upon.

Read it alongside Burke's Reflections to understand the terms of the great political argument that still structures our politics. The Burke-Paine debate — between tradition and reason, between inherited wisdom and rational construction, between the gradual evolution of institutions and their deliberate reconstruction — is the argument between conservatism and liberalism in its most fundamental form.

Read it for Paine himself — the Anglo-American common man who was present at two revolutions, who wrote the most influential documents of both, and who was left to die alone in New York having given everything to causes that outlasted and ultimately abandoned him. His story is an argument in itself: that the price of radical democratic advocacy has never been low, and that the people who paid it have rarely been adequately thanked.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Part First, Introduction',
        paragraphIndex: 3,
        label:
          "Paine's answer to Burke — the argument that rights inhere in persons, not in historical precedents or inherited charters.",
      },
      {
        chapterTitle: 'Part First, Chapter IV',
        paragraphIndex: 2,
        label:
          'The theory of natural rights — Paine\'s foundational argument that rights precede political institutions and cannot be legitimately alienated.',
      },
      {
        chapterTitle: 'Part Second, Chapter V',
        paragraphIndex: 6,
        label:
          '"My country is the world" — the passage that defines Paine\'s cosmopolitan humanism, still radical two centuries later.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 13. SONS AND LOVERS — D.H. Lawrence, 1913
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'sons-and-lovers',
    title: 'Sons and Lovers',
    onChainTitle: 'Sons and Lovers',
    author: 'D.H. Lawrence',
    yearWritten: 1913,
    nationality: 'English',
    era: '20th Century',
    genre: ['Literary Fiction', 'Autobiographical', 'Modernism'],
    coverColor: '#1e3a5f',
    pullQuote:
      'She was not satisfied. She had had that moment of perfect love lost — lost for the sake of a pound of pork chops.',
    pullQuoteAttribution: 'D.H. Lawrence, Sons and Lovers, Chapter I',
    banHistory: [
      {
        year: 1915,
        entity: 'Metropolitan Police / Home Office',
        country: 'Great Britain',
        reasonGiven:
          "The Rainbow (1915) was seized and banned; while Sons and Lovers escaped direct prosecution, Lawrence was subjected to intense official surveillance and his subsequent works were suppressed in anticipation of the Sons and Lovers controversy.",
        action:
          "Lawrence's publisher was prosecuted for The Rainbow; Lawrence himself was suspected of pro-German sympathies and driven from his Cornwall cottage under the Defence of the Realm Act.",
        outcome:
          "Lawrence and his German wife Frieda were effectively stateless refugees in their own country. Lawrence could not publish The Rainbow in Britain until 1926. Sons and Lovers, though not directly banned, became part of the same suppressive atmosphere.",
      },
      {
        year: 1953,
        entity: 'U.S. Customs Service',
        country: 'United States',
        reasonGiven:
          "D.H. Lawrence's works were systematically targeted under American obscenity law. Lady Chatterley's Lover was the most prominent target, but all Lawrence's books were under suspicion.",
        action:
          'Customs seizures of Lawrence titles; Sons and Lovers was listed as objectionable material in several state investigations.',
        outcome:
          "Grove Press's 1959 publication of Lady Chatterley's Lover and the subsequent successful obscenity trial effectively ended the American censorship of Lawrence.",
      },
    ],
    authorBio: {
      born: 'September 11, 1885, Eastwood, Nottinghamshire, England',
      died: 'March 2, 1930, Vence, France',
      nationality: 'English',
      era: 'Modernism',
      otherWorks: [
        'The Rainbow',
        'Women in Love',
        "Lady Chatterley's Lover",
        'The Prussian Officer',
        'Studies in Classic American Literature',
      ],
      politicalContext: `David Herbert Lawrence was the son of a coal miner and a schoolteacher whose social aspirations for her brilliant son were entangled with her contempt for her husband's class and his failure to rise above it. Sons and Lovers is explicitly autobiographical — Mrs. Morel is his mother Lydia, Walter Morel is his father Arthur, Paul is Lawrence himself — and the domestic drama it records is the central psychological drama of Lawrence's life: the son who loves his mother too intensely and loves women too anxiously, who feels the pull of the working class and the aspiration of the educated, who belongs entirely to neither.

Lawrence grew up in the Nottinghamshire coalfields at the height of British industrial capitalism, a landscape of systematic environmental and human degradation. His father worked underground; Lawrence watched the coal industry consume men's bodies and spirits and channeled that observation into his fiction's persistent argument that industrial capitalism was killing something essential in human beings — not just their bodies but their instinctual, vital selves.

He eloped with Frieda Weekley (née von Richthofen), the wife of his former professor and the cousin of the Red Baron, in 1912. Their relationship was passionate, combative, and permanent — they stayed together until Lawrence's death eighteen years later. Frieda's influence on Sons and Lovers was direct: she recognized the Oedipal dynamics of Paul's relationship with his mother and pushed Lawrence to develop that reading in the novel.

World War I broke Lawrence. He was classified medically unfit for service but subjected to repeated humiliating medical examinations; Frieda's German nationality made them objects of suspicion; they were expelled from Cornwall, banned from coastal areas, and rendered destitute. Lawrence spent the last decade of his life in voluntary exile — New Mexico, Australia, Italy, Mexico — pursuing what he called "the spirit of place" and writing the increasingly explicit fiction that would eventually be prosecuted in his own country.`,
    },
    whyDangerous: `Sons and Lovers is dangerous because it was the first English novel to render the Oedipus complex — Freud's account of the pathological intensity of mother-son attachment — as the central dynamic of its narrative, and to do so with clinical sympathy for all parties. Mrs. Morel is not simply a possessive mother; she is a brilliant, unfulfilled woman trapped in a working-class marriage, and her transference of ambition onto her sons is understandable even as it destroys them. Paul is not simply an Oedipal son; he is a young man whose capacity for adult love has been preempted by a love too large to replace.

Lawrence's sexual frankness was inseparable from this psychological argument. To understand why Paul cannot love Miriam or Clara fully, you needed to understand the nature of his attachment to his mother — which meant describing the erotic dimensions of that attachment, which meant describing sexuality more directly than Victorian or Edwardian fiction had done. The censors who suppressed Lawrence's work sensed, correctly, that the sexual content was the vehicle for a critique of middle-class repression more damaging than pornography: it was a diagnostic of how Victorian domesticity produced psychological damage.

The novel also breaks class. Paul's trajectory from the pit village to the painter's studio, from the working class to the educated middle class, is not triumphant but anguished. The novel refuses to endorse either class's values; it depicts the working class with unflinching honesty about its limitations and the middle class with an equal honesty about its emotional constipation. Both worlds fail Paul in different ways.`,
    whatBanReveals: `The suppression of Lawrence's work during World War I reveals how censorship serves multiple simultaneous purposes. The official justifications invoked obscenity law and the Defence of the Realm Act (anti-German provisions); the actual motivations included class resentment (a miner's son writing with authority about sexuality and consciousness), anti-German xenophobia (Frieda's nationality), political suspicion (Lawrence's pacifism), and general unease with a writer who seemed to have x-ray vision for the psychological substrata of respectable life.

The American customs seizures of the 1950s reveal how obscenity law was used as a blunt instrument against literary ambition generally: the specific passages seized were less important than the general principle that the state could regulate literary explicitness. The victory in the Lady Chatterley trial was also a victory for Sons and Lovers, Women in Love, and every other Lawrence text — not because the court liked Lawrence, but because it established that literary merit was a defense against obscenity prosecution.

What both suppressions reveal is that Lawrence's real offense was not sexuality but honesty — about class, about the body, about the Oedipal dynamics of English family life, about the psychological cost of industrial civilization. Sexuality was the legal hook; the deeper anxiety was about a writer who could see through the surfaces of respectable English life and was not afraid to describe what he found there.`,
    whyReadIt: `Read Sons and Lovers because it is one of the great portraits of psychological damage in fiction — not lurid or clinical, but inhabited, empathetic, and precise. Lawrence renders the Morel family dynamics from inside each character's consciousness in turn, and the effect is a sympathetic comprehensiveness that makes it impossible to assign simple blame. No one is simply the villain; everyone is comprehensible within their constraints.

Read it for the prose, which in Sons and Lovers is at its most controlled — sharper and more disciplined than the later Lawrence, less given to prophetic pronouncement, more attentive to particular detail. The scenes of Paul painting, of the Sunday afternoons in the Morel household, of the field of flowers where Paul and Miriam discuss faith — these are rendered with the tactile precision of a painter, which Lawrence might have been.

Read it as an autobiography of a kind of experience — the working-class boy who escapes through education into a middle-class world that doesn't fully admit him, whose family love and family damage travel with him regardless of geography — that remains one of the most common experiences of social mobility in industrial societies. Lawrence was the first writer to render that experience from the inside, without condescension and without sentimentality.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Chapter I: The Early Married Life of the Morels',
        paragraphIndex: 8,
        label:
          "The first portrait of the Morel marriage — Lawrence's account of how two people's fundamental incompatibility is established before their children are born.",
      },
      {
        chapterTitle: 'Chapter VII: Lad-and-Girl Love',
        paragraphIndex: 12,
        label:
          "Paul and Miriam among the flowers — the scene that defines their failed relationship, the mystical versus the physical.",
      },
      {
        chapterTitle: 'Chapter XIV: The Release',
        paragraphIndex: 5,
        label:
          "Paul's decision after his mother's death — the novel's devastating conclusion, Paul at the edge of dissolution, choosing to walk toward the city lights.",
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 14. DUBLINERS — James Joyce, 1914
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'dubliners',
    title: 'Dubliners',
    onChainTitle: 'Dubliners',
    author: 'James Joyce',
    yearWritten: 1914,
    nationality: 'Irish',
    era: '20th Century',
    genre: ['Short Stories', 'Modernism', 'Social Realism'],
    coverColor: '#1e3a5f',
    pullQuote:
      'His soul swooned slowly as he heard the snow falling faintly through the universe and faintly falling, like the descent of their last end, upon all the living and the dead.',
    pullQuoteAttribution: 'James Joyce, Dubliners, "The Dead"',
    banHistory: [
      {
        year: 1906,
        entity: 'Grant Richards (publisher)',
        country: 'Great Britain',
        reasonGiven:
          "Richards's printer refused to set certain stories, particularly 'Two Gallants' and 'Counterparts,' claiming they were indecent. Richards asked Joyce to make cuts.",
        action:
          'Publisher withdrew the contract; the book was left unpublished for eight years. Joyce was told specific phrases, references to King Edward VII, and the word "bloody" were unacceptable.',
        outcome:
          "Joyce made some minor revisions but refused to compromise the substance of the stories. Richards eventually published the book in 1914 after Grant himself had been replaced.",
      },
      {
        year: 1912,
        entity: 'Maunsel & Company (Dublin publisher)',
        country: 'Ireland',
        reasonGiven:
          "Irish publisher George Roberts feared the stories would be libellous — real Dublin establishments were named — and that Catholic Ireland would find them offensive.",
        action:
          "Roberts demanded extensive alterations. When Joyce refused, Roberts destroyed the entire print run. Joyce retrieved a single set of proofs — the only surviving copy.",
        outcome:
          "Joyce wrote a broadside poem, 'Gas from a Burner,' ridiculing Roberts, and left Ireland forever, declaring his native country had driven him out. Dubliners was eventually published by Grant Richards in London in 1914, ten years after it was written.",
      },
      {
        year: 1953,
        entity: 'Newsstand distributor',
        country: 'United States',
        reasonGiven:
          'A volume of Joyce stories was removed from newsstands after being flagged as obscene by distributors in several states.',
        action: 'Removal from newsstand distribution.',
        outcome:
          'The incident was minor compared to the European suppression history; by 1953, Joyce was recognized as a canonical modernist.',
      },
    ],
    authorBio: {
      born: 'February 2, 1882, Rathgar, Dublin, Ireland',
      died: 'January 13, 1941, Zürich, Switzerland',
      nationality: 'Irish',
      era: 'Modernism',
      otherWorks: [
        'A Portrait of the Artist as a Young Man',
        'Ulysses',
        'Finnegans Wake',
        'Chamber Music',
        'Exiles',
      ],
      politicalContext: `James Joyce grew up in a Dublin shaped by three forces: the colonial domination of British imperial authority, the cultural and moral authority of the Catholic Church, and the political movements — Parnellism, the Irish Literary Revival, nascent nationalism — that were responding to both. His father John Joyce was a singer, a wit, and an alcoholic who moved the family repeatedly downward through the social scale, from comfortable middle-class comfort to genteel poverty, giving James both his keen ear for Dublin speech and his intimate knowledge of social decline.

Joyce left Ireland in 1904 with Nora Barnacle, whom he had met only four months earlier, and never permanently returned. He spent his adult life in Trieste, Rome, Zurich, and Paris — always in exile, always writing about Dublin, always arguing with a city he could not live in and could not leave alone. His relationship with Ireland was the defining creative tension of his life: he had to get away from it to see it, and seeing it was all he could do.

Dubliners was written between 1904 and 1907, during Joyce's Trieste years, when he was working as an English language teacher at the Berlitz school and beginning to develop the techniques — stream of consciousness, epiphany, symbolic structure — that would reach their fullest expression in Ulysses. The stories were conceived as a naturalistic portrait of Dublin as a city of paralysis: spiritual, political, and sexual. The word "paralysis" appears in the first story ("The Sisters") and describes the condition from which all the stories' characters cannot escape.

The ten-year battle to publish Dubliners is one of the most instructive stories in literary history about how censorship, cultural timidity, and commercial cowardice combine to suppress important work. By the time the book appeared in 1914, Joyce had already written most of A Portrait of the Artist as a Young Man. He was thirty-two and had still not published a word of fiction.`,
    },
    whyDangerous: `Dubliners is dangerous because it is the first collection of short stories to treat Irish Catholic working and middle-class life with the same unflinching naturalistic precision that Zola applied to French working-class life. The publishers who refused it understood this: Joyce named real Dublin pubs, real Dublin streets, real Dublin institutions; his characters drank, committed petty infidelities, experienced sexual shame, died in despair. This was not the Ireland of Celtic mythology and romantic nationalism; it was the Ireland that actually existed, and its representation was experienced as desecration.

The collection's structural argument — that Dublin is a city of paralysis, that its people are frozen in place by colonial deference, Catholic guilt, poverty, and hopelessness — was also dangerous because it was accurate and because it named the condition rather than endorsing or sentimentalizing it. The Revivalists wanted to celebrate Irish culture; Joyce wanted to diagnose it. Both were forms of love, but the diagnostic form was unwelcome.

"The Dead," the final story — Gabriel Conroy's recognition that his wife's deepest emotion belongs to a man who died before Gabriel ever knew her, his confrontation with his own smallness against the mystery of another person's inner life — is dangerous in the most fundamental sense: it is so good that it changes what you know is possible in prose fiction.`,
    whatBanReveals: `The decade-long suppression of Dubliners reveals how colonial culture operates on its own artists. The Irish publishers who destroyed the print run were not British censors; they were Irish Catholics who had internalized the colonial and religious values that made an honest portrait of Irish life seem more threatening than a flattering one. This is the mechanism of cultural colonialism: the colonized subjects enforce the norms of respectability that the colonizers have introduced.

The printer's refusal to set specific words and passages reveals how print production was itself a site of moral policing — not by the state but by the tradespeople whose labor was required to make a book exist. This informal network of printers, publishers, and distributors who refused to participate in the production or circulation of objectionable material was more effective, in many cases, than formal legal censorship.

Joyce's decision, in response to the Dublin publisher's destruction of the print run, to leave Ireland permanently and never return is one of the great consequences of literary censorship. Ireland drove out its greatest writer at the moment when his early work might have shaped Irish literary culture from within. What Irish literature lost — and what Joyce gained in exile's perspective — cannot be calculated.`,
    whyReadIt: `Read Dubliners because "The Dead" is the most perfect short story in English. This is not a statement that everyone would accept, but it is a widely held judgment among writers and critics for a simple reason: the story manages to be simultaneously a precise social portrait of a Dublin Christmas party, a study of male self-deception, a meditation on mortality and memory, and, in its final pages, an expansion into something that feels like the whole of human experience. It is a masterpiece in the literal sense: the work by which a master demonstrates mastery.

Read the whole collection because the epiphanies — the moments in which a character suddenly perceives the nature of their condition — accumulate across fifteen stories into a comprehensive diagnosis of how societies trap individuals in patterns they cannot escape. Each story ends at the moment of recognition; what comes next, if anything, is left to the reader's imagination.

Read it knowing that it was suppressed for ten years because it named real Dublin pubs and used the word "bloody." This ratio of cause to consequence — the gap between what censorship claimed to protect against and what it actually suppressed — is a measure of how disproportionate the cultural cost of censorship typically is.`,
    featuredParagraphs: [
      {
        chapterTitle: 'The Sisters',
        paragraphIndex: 1,
        label:
          '"There was no hope for him this time" — the collection\'s opening sentence, establishing the tone of inevitable decline that runs through every story.',
      },
      {
        chapterTitle: 'Eveline',
        paragraphIndex: 8,
        label:
          'Eveline at the quay — the story\'s climax, the moment of paralysis frozen in time as the boat prepares to leave.',
      },
      {
        chapterTitle: 'The Dead',
        paragraphIndex: 42,
        label:
          '"His soul swooned slowly..." — the final paragraph, one of the supreme endings in English prose fiction.',
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // 15. DON QUIXOTE — Miguel de Cervantes, 1605
  // ─────────────────────────────────────────────────────────────────────────
  {
    slug: 'don-quixote',
    title: 'Don Quixote',
    onChainTitle: 'Don Quixote',
    author: 'Miguel de Cervantes',
    yearWritten: 1605,
    nationality: 'Spanish',
    era: '18th Century and Earlier',
    genre: ['Novel', 'Satire', 'Chivalric Parody'],
    coverColor: '#6b2d2d',
    pullQuote:
      'For neither good nor evil can last forever; and so it follows that as evil has lasted a long time, good must now be close at hand.',
    pullQuoteAttribution: 'Miguel de Cervantes, Don Quixote, Part I, Chapter XVIII',
    banHistory: [
      {
        year: 1640,
        entity: 'Spanish Inquisition',
        country: 'Spain',
        reasonGiven:
          'Specific passages and editions of Don Quixote were reviewed by the Inquisition. The 1640 Index of the Spanish Inquisition required expurgation of certain passages, particularly those touching on prophecy, prayer outside the Church, and heterodox spiritual practices.',
        action:
          'Expurgated editions were required; the unamended text was prohibited. Censors went through the text marking offending passages for removal.',
        outcome:
          'Expurgated editions circulated in Spain while fuller texts were available in translation in Protestant countries. The Inquisition\'s interference is documented in surviving copies with censors\' marks.',
      },
      {
        year: 1905,
        entity: 'Local school authorities',
        country: 'United States',
        reasonGiven:
          "Challenged as promoting delusion, mocking religion, and presenting a morally ambiguous protagonist; specific challenges related to scenes of violence and the protagonist's mental illness.",
        action: 'Challenged in several school contexts for age-appropriateness.',
        outcome:
          'Challenges unsuccessful; the novel is now recognized as a foundational work of Western literature and widely taught.',
      },
    ],
    authorBio: {
      born: 'September 29, 1547, Alcalá de Henares, Spain',
      died: 'April 23, 1616, Madrid, Spain',
      nationality: 'Spanish',
      era: 'Golden Age (Siglo de Oro)',
      otherWorks: [
        'Novelas Ejemplares (Exemplary Stories)',
        'La Galatea',
        'Los trabajos de Persiles y Sigismunda',
        'Ocho comedias',
      ],
      politicalContext: `Miguel de Cervantes lived a life of extraordinary misfortune and extraordinary resilience. He fought at the Battle of Lepanto (1571), one of the largest naval battles in history, and was wounded three times, leaving his left hand permanently disabled — hence his sobriquet, "the one-handed man of Lepanto." He was captured by Barbary pirates on the voyage home and spent five years as a slave in Algiers (1575–80), during which he organized four escape attempts, each time throwing himself on his captors' mercy to protect his companions. When he was finally ransomed, it was through the efforts of Trinitarian friars.

His return to Spain brought no reward for his military service. He spent years in various unsuccessful commercial and government positions, was imprisoned twice for accounting irregularities in his tax-collecting work, and received no royal pension despite his Lepanto service. He began writing Don Quixote around 1600, in his early fifties, as a satire of chivalric romance — the equivalent of writing a parody of superhero movies — and produced a book that transformed the genre it mocked into the founding text of the European novel.

Spain in Cervantes's time was the greatest empire in the world and in profound internal crisis. The expulsion of the Moriscos (converted Moors) was completed in 1609; the Inquisition enforced religious conformity with institutional violence; the economic base of empire — American silver — was beginning to produce inflation and social disruption rather than prosperity. The Golden Age of Spanish culture was inseparable from these contradictions: extraordinary artistic production fueled by imperial wealth, subject to institutional censorship, aware at some level of its own fragility.

Cervantes died on April 23, 1616 — the same day as William Shakespeare, though the calendar difference between England and Spain means they died on different actual days. The coincidence has enchanted literary history. He died in poverty, having completed his final novel Persiles y Sigismunda just days before the end.`,
    },
    whyDangerous: `Don Quixote is dangerous because it is simultaneously a parody of a literary genre and the founding text of a new one — and in that transition it raises questions about the relationship between narrative and reality that remain philosophically unresolved. Quixote believes the fictions he has read; he cannot distinguish between the world of chivalric romance and the world of 17th-century La Mancha. Is he mad, or does he see a dimension of reality that the sane cannot access?

Cervantes's novel refuses to answer this question cleanly. At moments Quixote is clearly pathetic — tilting at windmills, beaten by muleteers, humiliated and deluded. At others, his vision of a world governed by honor, courage, and the protection of the weak seems morally superior to the world of practical common sense that surrounds and defeats him. This ambiguity was dangerous to a society organized around firm categories: sanity and madness, fiction and truth, the ideal and the real.

The novel also satirized precisely the chivalric literature that had provided the ideological scaffolding for Spanish imperial culture — the heroic knight, the conquest of alien worlds in service of Christian civilization. This satire, conducted through comedy rather than criticism, was the most effective tool available. You cannot ban comedy without appearing ridiculous; you can only try to suppress its circulation and hope the laughter dies before it spreads.`,
    whatBanReveals: `The Spanish Inquisition's expurgation orders for Don Quixote reveal the difficulty of censoring a work that is ostensibly satirizing rather than endorsing heterodox views. The novel mocks chivalric romances and, through them, a certain species of deluded idealism; but the mechanisms of mockery — Quixote's encounters with priests, pilgrims, and spiritual practices — inevitably touch on religious life in ways that the Inquisition found unacceptable. The censors' marks in surviving copies show them trying to excise specific passages while leaving the bulk of the text intact, which is itself an argument for the impossibility of surgical censorship.

The expurgated Spanish editions alongside the fuller foreign translations reveal how censorship can backfire by drawing attention to what it suppresses: readers who compared the Spanish and Dutch editions knew exactly what the Inquisition had removed, and why. The censored passages became, by their absence, more significant than they might otherwise have been.

The 20th-century American challenges to the novel reveal how completely the historical specificity of censorship can be lost: by 1905 the chivalric romance was no longer a living genre, the Inquisition was history, and the novel was challenged for reasons Cervantes could not have anticipated — violence, mental illness, religious mockery. Each era censors what it fears, and what it fears changes, but the impulse to suppress what is uncomfortable remains constant.`,
    whyReadIt: `Read Don Quixote because it invented the novel as a form — not just as a narrative, but as a machine for exploring the relationship between imagination and reality, self and world, the ideal and the actual. Every subsequent novel that engages self-consciously with its own fictionality — from Fielding to Sterne to Nabokov — is in conversation with Cervantes's foundational innovation.

Read it for Sancho Panza, who is in some ways the more interesting character: a pragmatic peasant who follows a madman, who gradually comes to believe in the knight-errantry he began by humouring, and who, as the novel progresses, becomes a kind of idealist himself. The transformation of Sancho is as remarkable as any element in the novel, and it suggests Cervantes's deepest argument: that sustained proximity to an idealist changes you, even if you start as a materialist.

Read it, finally, as an argument for the persistence of idealism in a world that defeats it. Quixote fails — repeatedly, completely, sometimes comically, sometimes heartbreakingly. And yet his project — to live by an honorable code, to defend the weak, to insist that the world can be better than it is — remains sympathetic long after the windmills have defeated him. This is not sentimentality; it is Cervantes's most precise and most difficult observation about the human condition.`,
    featuredParagraphs: [
      {
        chapterTitle: 'Part I, Chapter VIII',
        paragraphIndex: 3,
        label:
          'The windmill episode — the novel\'s most famous scene, the origin of "tilting at windmills" as a cultural metaphor for deluded idealism.',
      },
      {
        chapterTitle: 'Part I, Chapter XXII',
        paragraphIndex: 5,
        label:
          "Quixote frees the galley slaves — the episode that best captures the novel's central irony: the liberation that creates more suffering.",
      },
      {
        chapterTitle: 'Part II, Chapter LXXIV',
        paragraphIndex: 2,
        label:
          "Quixote's deathbed sanity — the heartbreaking conclusion in which Quixote recovers his reason and loses everything that made him extraordinary.",
      },
    ],
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// UTILITY EXPORTS
// ─────────────────────────────────────────────────────────────────────────────

/** Lookup a book by its URL slug. */
export function getBookBySlug(slug: string): BannedBookProfile | undefined {
  return bannedBooks.find((book) => book.slug === slug)
}

/** Return all slugs — used by Next.js generateStaticParams. */
export function getBannedBookSlugs(): string[] {
  return bannedBooks.map((book) => book.slug)
}

/**
 * Set of on-chain title strings for O(1) badge detection in the library view.
 * Matches against the exact string stored on the Flow blockchain.
 */
export const bannedTitles: Set<string> = new Set(
  bannedBooks.map((book) => book.onChainTitle)
)

/** Map on-chain title → URL slug for banned book profile links. */
export const bannedTitleToSlug: Map<string, string> = new Map(
  bannedBooks.map((book) => [book.onChainTitle, book.slug])
)

export type BanReason = 'political' | 'religious' | 'sexual' | 'racial' | 'lgbtq'

export type EraFilterKey = '16-17' | '18' | '19' | '20' | 'modern'

const BAN_REASON_PATTERNS: Record<BanReason, RegExp> = {
  political: /\b(politic|communist|socialist|revolution|treason|sedition|government|monarch|republic|democrat|radical|leftist|franco|soviet|cold war|manifesto|rights of man|muckrak)\b/i,
  religious: /\b(religio|church|vatican|index librorum|blasphem|heretic|immoral|moral|piety|christian|biblical|theolog|jesuit|inquisition|licensing act)\b/i,
  sexual: /\b(sexual|sex|obscen|erotic|adulter|infidel|body|nudity|vulgar|immoral|prostitut|desire|lgbtq|homosexual|gay|lesbian|queer)\b/i,
  racial: /\b(racial|racist|n-word|slave|negro|chattel|segregat|black student|african)\b/i,
  lgbtq: /\b(lgbtq|homosexual|gay|lesbian|queer|same-sex|transgender|gender identity|sexual orientation)\b/i,
}

/** Derive ban reason tags from documented ban events. */
export function getBookBanReasons(book: BannedBookProfile): BanReason[] {
  const corpus = book.banHistory
    .flatMap((e) => [e.reasonGiven, e.action, e.entity].join(' '))
    .join(' ')
  const reasons = (Object.keys(BAN_REASON_PATTERNS) as BanReason[]).filter((key) =>
    BAN_REASON_PATTERNS[key].test(corpus)
  )
  if (reasons.includes('lgbtq') && reasons.includes('sexual')) {
    return reasons.filter((r) => r !== 'sexual')
  }
  return reasons.length > 0 ? reasons : ['political']
}

/** Map a book to an era filter chip key. */
export function getBookEraKey(book: BannedBookProfile): EraFilterKey {
  const y = book.yearWritten
  if (y < 1700) return '16-17'
  if (y < 1800) return '18'
  if (y < 1900) return '19'
  if (y < 2000) return '20'
  return 'modern'
}

/** Most recent documented ban year, if any. */
export function getLatestBanYear(book: BannedBookProfile): number {
  return book.banHistory.reduce((max, e) => Math.max(max, e.year), book.yearWritten)
}

/** Short pull line for listing cards — first ban reason, trimmed. */
export function getBanSummaryQuote(book: BannedBookProfile): string {
  const reason = book.banHistory[0]?.reasonGiven ?? 'Removed from circulation by authorities.'
  const trimmed = reason.length > 120 ? `${reason.slice(0, 117)}…` : reason
  return `“${trimmed}”`
}

/** Deep link into the on-chain reader. */
export function getLibraryBookUrl(book: BannedBookProfile): string {
  return `/library?book=${encodeURIComponent(book.onChainTitle)}`
}
