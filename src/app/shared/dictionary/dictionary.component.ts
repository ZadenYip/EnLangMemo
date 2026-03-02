import { Component, computed, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { AfterViewInit, ElementRef, HostListener, signal, viewChild } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { Definition, DictionaryEntry } from './dictionary-interface';
import { DictionaryWindowService } from './dictionary-window.service';
import { DictionarySelectionService } from './selection/selection.service';
import { MeaningCardComponent } from './sub-components/meaning-card.component';
import Logger from 'electron-log/renderer';
import { TranslatePipe } from '@ngx-translate/core';

@Component({
    selector: 'app-dictionary',
    imports: [
        MatCardModule,
        MatIconModule,
        MatDividerModule,
        MatButtonModule,
        MeaningCardComponent,
        TranslatePipe
    ],
    templateUrl: './dictionary.component.html',
    styleUrl: './dictionary.component.scss',
})
export class DictionaryComponent implements AfterViewInit {
    private readonly selectionService = inject(DictionarySelectionService);
    private readonly dictionaryWindowService = inject(DictionaryWindowService);
    readonly dictionaryWindow =
        viewChild<ElementRef<HTMLElement>>('dictionaryWindow');

    // Floating window top-left position in viewport coordinates.
    readonly windowPosition = signal({ left: 24, top: 24 });
    // Floating window size in pixels.
    readonly windowSize = signal({ width: 960, height: 640 });

    // Viewport and sizing constraints.
    private readonly minWindowWidth = 620;
    private readonly minWindowHeight = 420;

    // Interaction state.
    private isDragging = false;
    private isResizing = false;
    // Drag start snapshot.
    private dragStartPointerX = 0;
    private dragStartPointerY = 0;
    private dragStartLeft = 0;
    private dragStartTop = 0;
    // Resize start snapshot.
    private resizeStartPointerX = 0;
    private resizeStartPointerY = 0;
    private resizeStartWidth = 0;
    private resizeStartHeight = 0;
    private resizeStartLeft = 0;
    private resizeStartTop = 0;

    readonly selectedText = computed(
        () => this.selectionService.selection().selectedText,
    );
    readonly contextSentence = computed(
        () => this.selectionService.selection().contextSentence,
    );
    readonly visible = computed(() => this.dictionaryWindowService.visible());

    hideWindow(): void {
        this.dictionaryWindowService.hide();
    }

    ngAfterViewInit(): void {
        // Read initial rendered rect and sync it into reactive state.
        const windowRef = this.dictionaryWindow();
        if (!windowRef) {
            return;
        }
        const rect = windowRef.nativeElement.getBoundingClientRect();
        this.windowPosition.set({
            left: rect.left,
            top: rect.top,
        });
        this.windowSize.set({
            width: rect.width,
            height: rect.height,
        });
        this.normalizeWindowBounds();
    }

    onWindowDragStart(event: PointerEvent): void {
        // Do not start drag if currently resizing.
        if (this.isResizing) {
            return;
        }

        // Only left mouse button starts drag.
        if (event.button !== 0) {
            return;
        }

        // Do not start drag when clicking toolbar buttons (e.g. close).
        const target = event.target as HTMLElement | null;
        if (target?.closest('button')) {
            return;
        }

        // prevent original drag behavior (e.g. text selection) and start dragging.
        event.preventDefault();
        this.isDragging = true;
        this.dragStartPointerX = event.clientX;
        this.dragStartPointerY = event.clientY;
        this.dragStartLeft = this.windowPosition().left;
        this.dragStartTop = this.windowPosition().top;
    }

    @HostListener('document:pointermove', ['$event'])
    onPointerMove(event: PointerEvent): void {
        if (this.handleResizeMove(event)) {
            return;
        }
        this.handleDragMove(event);
    }

    private handleResizeMove(event: PointerEvent): boolean {
        if (!this.isResizing) {
            return false;
        }
        const deltaX = event.clientX - this.resizeStartPointerX;
        const deltaY = event.clientY - this.resizeStartPointerY;
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;

        // Max size is anchored by the start top-left corner.
        const maxWidth = Math.max(
            this.minWindowWidth,
            viewportWidth - this.resizeStartLeft,
        );
        const maxHeight = Math.max(
            this.minWindowHeight,
            viewportHeight - this.resizeStartTop,
        );
        const nextSize = {
            width: Math.min(
                Math.max(this.resizeStartWidth + deltaX, this.minWindowWidth),
                maxWidth,
            ),
            height: Math.min(
                Math.max(this.resizeStartHeight + deltaY, this.minWindowHeight),
                maxHeight,
            ),
        };
        this.windowSize.set(nextSize);
        return true;
    }

    private handleDragMove(event: PointerEvent): void {
        if (!this.isDragging) {
            return;
        }

        // Drag by pointer delta and clamp into viewport bounds.
        const deltaX = event.clientX - this.dragStartPointerX;
        const deltaY = event.clientY - this.dragStartPointerY;
        const nextPosition = this.clampPositionToViewport({
            left: this.dragStartLeft + deltaX,
            top: this.dragStartTop + deltaY,
        });
        this.windowPosition.set(nextPosition);
    }

    onResizeStart(event: PointerEvent): void {
        // ignore non-left-clicks.
        if (event.button !== 0) {
            return;
        }

        // Ensure state is valid before taking resize baseline.
        this.normalizeWindowBounds();
        event.preventDefault();
        event.stopPropagation();
        this.isResizing = true;
        this.resizeStartPointerX = event.clientX;
        this.resizeStartPointerY = event.clientY;
        this.resizeStartWidth = this.windowSize().width;
        this.resizeStartHeight = this.windowSize().height;
        this.resizeStartLeft = this.windowPosition().left;
        this.resizeStartTop = this.windowPosition().top;
    }

    @HostListener('document:pointerup')
    onPointerUp(): void {
        this.isDragging = false;
        this.isResizing = false;
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        // Keep window valid after viewport size changes.
        this.normalizeWindowBounds();
    }

    private normalizeWindowBounds(): void {
        if (!this.dictionaryWindow()) {
            return;
        }
        // Normalize size first, then position using normalized size.
        this.windowSize.set(this.clampSizeToViewport(this.windowSize()));
        this.windowPosition.set(
            this.clampPositionToViewport(this.windowPosition()),
        );
    }

    private clampPositionToViewport(position: { left: number; top: number }): {
        left: number;
        top: number;
    } {
        // Clamp top-left so the whole window remains inside viewport.
        const size = this.windowSize();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const maxLeft = Math.max(
            0,
            viewportWidth - size.width,
        );
        const maxTop = Math.max(
            0,
            viewportHeight - size.height,
        );
        return {
            left: Math.min(Math.max(position.left, 0), maxLeft),
            top: Math.min(Math.max(position.top, 0), maxTop),
        };
    }

    private clampSizeToViewport(size: { width: number; height: number }): {
        width: number;
        height: number;
    } {
        // Clamp size by min constraints and available space from current top-left.
        const position = this.windowPosition();
        const viewportWidth = document.documentElement.clientWidth;
        const viewportHeight = document.documentElement.clientHeight;
        const maxWidth = Math.max(
            this.minWindowWidth,
            viewportWidth - position.left,
        );
        const maxHeight = Math.max(
            this.minWindowHeight,
            viewportHeight - position.top,
        );

        return {
            width: Math.min(
                Math.max(size.width, this.minWindowWidth),
                maxWidth,
            ),
            height: Math.min(
                Math.max(size.height, this.minWindowHeight),
                maxHeight,
            ),
        };
    }

    onAddCard(definition: Definition, partOfSpeech: string): void {
        Logger.info('add card', { partOfSpeech, definition });
    }

    readonly entry: DictionaryEntry = {
        word: 'run',
        phoneticSymbol: ['/rʌn/', '/rʌn/'],
        senses: [
            {
                partOfSpeech: 'verb',
                definitions: [
                    {
                        cefr: 'A1 [ I or T ]',
                        definition: {
                            source: '(of people and some animals) to move along, faster than walking, by taking quick steps in which each foot is lifted before the next foot touches the ground',
                            target: '跑，奔跑',
                        },
                        examples: [
                            {
                                source: 'The children had to run to keep up with their father.',
                                target: '孩子们得一路跑着才能跟上他们的父亲。',
                            },
                            {
                                source: 'I can run a mile in five minutes.',
                                target: '我可以在5分钟里跑1英里。',
                            },
                            {
                                source: 'The sheep ran away/off in fright.',
                                target: '羊受惊跑掉了。',
                            },
                            {
                                source: 'A little girl ran up to (= came quickly beside) me, crying for her daddy.',
                                target: '一个小女孩跑到我身边，哭着让我替她找爸爸。',
                            },
                            {
                                source: 'In the semi-final she will be running against her nearest rival.',
                                target: '半决赛中，她将与水平最接近自己的对手一决高下。',
                            },
                            {
                                source: 'The first two races will be run (= will happen) in 20 minutes.',
                                target: '头两个赛跑项目将在20分钟后举行。',
                            },
                        ],
                    },
                    {
                        cefr: '[ T ]',
                        definition: {
                            source: 'If you run an animal in a race, you cause it to take part.',
                            target: '使（狗、马等）参加比赛;赛（狗、马等）',
                        },
                        examples: [
                            {
                                source: 'Thompson Stables are running three horses in the next race.',
                                target: '汤普森赛马训练公司将派出3匹马参加下一场比赛。',
                            },
                        ],
                    },
                    {
                        cefr: '[ I + adv/prep ]',
                        definition: {
                            source: 'to go quickly or in a hurry',
                            target: '赶快;迅速赶往;匆忙跑（到某地方）',
                        },
                        examples: [
                            {
                                source: 'Would you run to the post office and get me some stamps?',
                                target: '你能不能赶快到邮局给我买一些邮票来？',
                            },
                            {
                                source: "You don't put on weight when you spend all day running around after small children.",
                                target: '你整天不歇脚地跟在小孩们后面转是胖不起来的。',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'to run fast in order to get or avoid something',
                            target: '奔跑追赶;赶抢;快跑躲避',
                        },
                        examples: [
                            {
                                source: 'I ran for the bus but it drove off.',
                                target: '我跑着去赶公共汽车，但是车却开走了。',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'to move your legs as if running, while you stay in one place',
                            target: '原地踏步跑',
                        },
                        examples: [
                            {
                                source: 'I run on the spot to warm up before I start training.',
                                target: '我在开始训练前原地踏步跑做准备活动。',
                            },
                        ],
                    },
                    {
                        cefr: 'B2 [ I or T,  usually + adv/prep ]',
                        definition: {
                            source: 'to (cause something to) travel, move, or continue in a particular way',
                            target: '（使）行进，（使）行驶，（使）移动；（使）持续',
                        },
                        examples: [
                            {
                                source: 'Trains are still running, despite the snow.',
                                target: '尽管下了雪，列车仍在运行。',
                            },
                            {
                                source: 'A bus runs (= goes on a particular route at particular times) three times a day into town.',
                                target: '有一趟公共汽车每天3次开往城里。',
                            },
                            {
                                source: 'Skis are waxed on the bottom so that they run smoothly over the snow.',
                                target: '滑雪板底部打了蜡，这样就能在雪上滑得顺畅自如。',
                            },
                            {
                                source: 'The route/railway/road runs (= goes) across the border/into Italy/through the mountains.',
                                target: '这条路线／铁道／公路穿过国界／通向意大利境内／在群山中穿行。',
                            },
                            {
                                source: 'A climbing rose bush runs (= grows) up the side of the door.',
                                target: '一丛攀缘蔷薇盘绕在门侧。',
                            },
                            {
                                source: "There's a beautiful cornice running around/round all the ceilings.",
                                target: '所有的天花板四边都装饰着漂亮的檐口。',
                            },
                            {
                                source: 'The film runs (= lasts) for two hours.',
                                target: '这部电影长两个小时。',
                            },
                            {
                                source: 'The show/course/film runs (= continues) for another week.',
                                target: '演出／课程／电影播放将再继续一周。',
                            },
                            {
                                source: 'A magazine subscription usually only runs (= can be used) for one year.',
                                target: '杂志订阅期限通常只能是一年。',
                            },
                            {
                                source: 'Buses are running an hour late, because of an earlier accident.',
                                target: '因为先前的一起车祸，公共汽车的运行晚点一小时。',
                            },
                            {
                                source: "The truck's brakes failed and it ran (= went) off the road.",
                                target: '卡车刹车失灵，冲出了马路。',
                            },
                            {
                                source: 'Trains run on rails (= move along on top of them).',
                                target: '火车在铁轨上行驶。',
                            },
                            {
                                source: 'Electricity is running through (= moving along within) this cable.',
                                target: '电流正通过这条电缆。',
                            },
                            {
                                source: 'An angry muttering ran through (= went through) the crowd.',
                                target: '人群中传出一阵低沉而愤怒的抱怨声。',
                            },
                            {
                                source: 'A shiver of fear ran through his (body).',
                                target: '一阵恐惧的战栗传遍他全身。',
                            },
                            {
                                source: 'She ran her finger along/down the page/list, looking for her name.',
                                target: '她用手指一行行划过那张纸／名单寻找自己的名字。',
                            },
                            {
                                source: 'Could you run the tape/film/video back/forwards, please?',
                                target: '你可以把磁带／电影／录像带倒回去／向前快进一下吗？',
                            },
                            {
                                source: 'Could you possibly run me (= take me in your car) home/to the station?',
                                target: '你能否开车把我送回家／到车站？',
                            },
                            {
                                source: 'He ran (= pushed) his fingers through his hair and looked up at me.',
                                target: '他用手梳拢了一下头发，抬头看我。',
                            },
                        ],
                    },
                    {
                        cefr: 'B2 [ I or T ]',
                        definition: {
                            source: 'to (cause something to) operate',
                            target: '（使）运转;（使）运作;（使）运行;操作',
                        },
                        examples: [
                            {
                                source: "Keep clear of the machines while they're running.",
                                target: '机器运转时不要靠近。',
                            },
                            {
                                source: 'The government took desperate measures to keep the economy running.',
                                target: '政府采取孤注一掷的措施来维持经济的运行。',
                            },
                            {
                                source: 'Do you know how to run this sort of machinery?',
                                target: '你会操作这种机器吗？',
                            },
                            {
                                source: 'The mechanic asked me to run the engine (= switch it on and allow it to work) for a minute.',
                                target: '修车工人让我发动引擎转一分钟。',
                            },
                            {
                                source: 'They had the new computer system up and running (= working) within an hour.',
                                target: '他们一小时之内就使新的计算机系统运行起来了。',
                            },
                            {
                                source: "We've run the computer program, but nothing happens.",
                                target: '我们已经运行了这个计算机程序，但是没有起作用。',
                            },
                            {
                                source: "We're running (= doing) an experiment.",
                                target: '我们正在做一个试验。',
                            },
                            {
                                source: 'The football team asked the coach which play they should run next.',
                                target: '',
                            },
                        ],
                    },
                    {
                        cefr: 'B1 [ T ]',
                        definition: {
                            source: 'to be in control of something',
                            target: '经营；管理；开办',
                        },
                        examples: [
                            {
                                source: "He's been running a restaurant/his own company since he left school.",
                                target: '他毕业后就一直在经营自己的饭店／公司。',
                            },
                            {
                                source: 'The local college runs (= provides) a course in self-defence.',
                                target: '当地的一所大学开了一门自我防卫课。',
                            },
                            {
                                source: 'a well-run/badly-run organization/business/course',
                                target: '管理良好／不善的组织；经营良好／很差的公司；设置得很好／差的课程',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'to control a business or other organization firmly and effectively',
                            target: '牢牢控制，有效的严格管理',
                        },
                        examples: [
                            {
                                source: 'Ruth runs a tight ship and has no time for shirkers.',
                                target: '露丝执行了有效的严格管理，员工没有办法开小差。',
                            },
                        ],
                    },
                    {
                        cefr: '[ T ]',
                        definition: {
                            source: 'If you run a car, you own one, drive it, and pay for the costs.',
                            target: '拥有（自己的车）；养（车）',
                        },
                        examples: [
                            {
                                source: "I can't afford to run a car.",
                                target: '我养不起车。',
                            },
                        ],
                    },
                    {
                        cefr: '[ T ]',
                        definition: {
                            source: 'to organize the way you live or work',
                            target: '安排（生活或工作）',
                        },
                        examples: [
                            {
                                source: 'Some people run their lives according to the movements of the stars.',
                                target: '一些人按照星体的运行规律来安排自己的生活。',
                            },
                        ],
                    },
                    {
                        cefr: 'B2 [ I or T ]',
                        definition: {
                            source: 'to (cause something to) flow or produce liquid',
                            target: '（使）流动;（使）流出;（使）排出;（尤指衣服的颜色）褪色，扩散，渗色',
                        },
                        examples: [
                            {
                                source: 'I can feel trickles of sweat running down my neck.',
                                target: '我可以感觉到津津汗水顺着脖子往下流淌。',
                            },
                            {
                                source: "Don't cry, or your make-up will run (= become liquid and move down your face).",
                                target: '别哭了，要不然化的妆就要花了。',
                            },
                            {
                                source: 'The walls were running with damp.',
                                target: '墙受潮出现了斑斑渍迹。',
                            },
                            {
                                source: 'The river runs (down) to/into the sea.',
                                target: '这条河流入大海。',
                            },
                            {
                                source: 'The hot tap is running cold (= producing cold water)!',
                                target: '热水龙头竟然流出了冷水！',
                            },
                            {
                                source: 'I turned the tap on and ran some cold water on the burn.',
                                target: '我打开水龙头用凉水冲被烫伤的地方。',
                            },
                            {
                                source: "I'll run you a hot bath (= fill a bath with water for you).",
                                target: '我去给你放洗澡水。',
                            },
                            {
                                source: 'My nose and eyes have been running all week because of hay fever.',
                                target: '我得了干草热，一星期都在流鼻涕淌眼泪。',
                            },
                            {
                                source: 'After twelve hours at her computer, the words began to run into one another (= seem mixed together).',
                                target: '她在文字处理机前工作了12小时后，看屏幕上的字都觉得模糊一片了。',
                            },
                        ],
                    },
                    {
                        cefr: '[ I or T ]',
                        definition: {
                            source: '(of colours in clothes, etc.) to come out or spread',
                            target: '（衣服的颜色）褪色，扩散，渗色',
                        },
                        examples: [
                            {
                                source: 'I must have washed my dress at too high a temperature, because the colour has run.',
                                target: '我洗这件裙子时用的水肯定太热了，因为都褪色了。',
                            },
                            {
                                source: "If the first layer isn't dry before you add the next one, the colours will run into each other (= mix).",
                                target: '如果第一层没有干就涂上第二层，那两层的颜色就会渗在一起。',
                            },
                        ],
                    },
                    {
                        cefr: '[ L only + adj ]',
                        definition: {
                            source: 'to be or become',
                            target: '变得；变成；成为',
                        },
                        examples: [
                            {
                                source: 'Differences between the two sides run deep (= are serious).',
                                target: '双方的分歧加剧了。',
                            },
                            {
                                source: 'The river/reservoir/well ran dry (= its supply of water finished).',
                                target: '河水／水库／水井干涸了。',
                            },
                            {
                                source: "Supplies are running low (= there's not much left).",
                                target: '储备所剩无几了。',
                            },
                            {
                                source: "We're beginning to run short of money/Money is beginning to run short (= there's not much left).",
                                target: '我们的钱快花完了／钱快花完了。',
                            },
                        ],
                    },
                    {
                        cefr: '[ I ] (UK also ladder)',
                        definition: {
                            source: 'If tights (= thin clothing that covers the legs) run, a long, thin hole appears in them.',
                            target: '（连裤袜或长筒袜上的）脱线，抽丝',
                        },
                        examples: [
                            {
                                source: 'Oh no, my tights have run!',
                                target: '哎呀，糟了，我的连裤袜抽丝了！',
                            },
                        ],
                    },
                    {
                        cefr: 'C1 [ T ]',
                        definition: {
                            source: 'to show something in a newspaper or magazine, on television, etc.',
                            target: '发表，刊登;播出',
                        },
                        examples: [
                            {
                                source: 'All the newspapers ran (= printed) stories about the new peace talks.',
                                target: '所有报纸都刊登了新一轮和谈的消息。',
                            },
                            {
                                source: 'Channel 4 is running a series on the unfairness of the legal system.',
                                target: '第四频道正在播出揭露法律体系不公正之处的系列节目。',
                            },
                        ],
                    },
                    {
                        cefr: '[ I ] Indian English',
                        definition: {
                            source: 'If a film is running at a particular place, you can see it there.',
                            target: '（电影在某处）放映',
                        },
                        examples: [
                            {
                                source: "What's running at the the Metro this week?",
                                target: '这周Metro电影院在放什么电影？',
                            },
                        ],
                    },
                    {
                        cefr: '[ I ]',
                        definition: {
                            source: 'to compete as a candidate in an election',
                            target: '参加竞选',
                        },
                        examples: [
                            {
                                source: 'Mrs Thatcher wanted to run a fourth time.',
                                target: '撒切尔夫人想要第四次参加竞选。',
                            },
                            {
                                source: "He's going to run against Smith/for president/for re-election.",
                                target: '他将要和史密斯作为对手进行竞选／竞选总统／竞选连任。',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'to compete as a candidate in an election for a position of authority and responsibility in a government or other organization',
                            target: '参加竞选',
                        },
                        examples: [
                            {
                                source: 'She is considering running for office.',
                                target: '她正在考虑参加竞选。',
                            },
                        ],
                    },
                    {
                        cefr: '[ T ]',
                        definition: {
                            source: 'to take guns or drugs illegally from one place to another',
                            target: '走私，非法携带（枪支或毒品）',
                        },
                        examples: [
                            {
                                source: 'He was arrested for running drugs across the border into America.',
                                target: '他因为越境向美国走私毒品而被捕。',
                            },
                        ],
                    },
                ],
            },
            {
                partOfSpeech: 'noun',
                definitions: [
                    {
                        cefr: 'B1 [ C ]',
                        definition: {
                            source: 'the action of running, especially for exercise',
                            target: '跑，奔跑;（尤指为了锻炼而进行的）跑步',
                        },
                        examples: [
                            {
                                source: 'We go for/do a three-mile run every evening after work.',
                                target: '我们每天傍晚下班后都会跑上3英里。',
                            },
                            {
                                source: "If you set off at a run (= running), you'll be exhausted later.",
                                target: '如果你一开始就跑，过些时候你就会筋疲力尽的。',
                            },
                        ],
                    },
                    {
                        cefr: '[ C ]',
                        definition: {
                            source: 'a journey',
                            target: '行程，航程',
                        },
                        examples: [
                            {
                                source: 'The number of aircraft on the New York-Moscow run is being increased.',
                                target: '纽约—莫斯科之间的航线正在增加航班。',
                            },
                            {
                                source: "Let's go for a run (out) in the car somewhere.",
                                target: '让我们开车到（外面）什么地方兜兜风吧。',
                            },
                            {
                                source: 'The plane swooped in on its bombing run.',
                                target: '飞机猛然俯冲下来轰炸。',
                            },
                        ],
                    },
                    {
                        cefr: '[ C ]',
                        definition: {
                            source: 'the period during which a play is performed',
                            target: '（一部戏的）连续上演（期）',
                        },
                        examples: [
                            {
                                source: "The musical's London run was a disaster.",
                                target: '该音乐剧在伦敦的演出彻底失败。',
                            },
                            {
                                source: "They're doing a run at the Cambridge Playhouse.",
                                target: '他们正在多玛仓库剧院进行连续演出。',
                            },
                        ],
                    },
                    {
                        cefr: '[ C usually singular ]',
                        definition: {
                            source: 'a situation in which many people suddenly buy a particular product',
                            target: '抢购；争购',
                        },
                        examples: [
                            {
                                source: "There's been a run on umbrellas because of all this rain.",
                                target: '就因为这场雨，大家都在抢购雨伞。',
                            },
                        ],
                    },
                    {
                        cefr: '[ C usually singular ]',
                        definition: {
                            source: 'a situation in which many people suddenly sell a particular product',
                            target: '抛售',
                        },
                        examples: [
                            {
                                source: 'A sudden run on the dollar has lowered its value.',
                                target: '突然出现的抛售导致美元贬值。',
                            },
                        ],
                    },
                    {
                        cefr: 'C2',
                        definition: {
                            source: 'A run of something is a continuous period during which it lasts or is repeated.',
                            target: '一连串',
                        },
                        examples: [
                            {
                                source: 'a run of successes/defeats/bad luck',
                                target: '一个又一个的成功／一连串的失败／厄运连连',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'the usual type of something',
                            target: '（某物的）普通类型，一般货色',
                        },
                        examples: [
                            {
                                source: 'Their food is the general run of hotel cooking.',
                                target: '他们的饭菜是一般宾馆饭菜的水平',
                            },
                        ],
                    },
                    {
                        cefr: '[ C ]',
                        definition: {
                            source: 'an area of ground of limited size for keeping animals',
                            target: '饲养场；牧场',
                        },
                        examples: [
                            {
                                source: 'a sheep/chicken/hen run',
                                target: '牧羊场／养鸡场',
                            },
                        ],
                    },
                    {
                        cefr: 'B2 [ C ]',
                        definition: {
                            source: 'in cricket and baseball, a single point, scored by running from one place to another',
                            target: '（板球或棒球中的）一分',
                        },
                        examples: [
                            {
                                source: 'England need 105 runs to win the game.',
                                target: '英格兰队需要得到105分才能赢得比赛。',
                            },
                            {
                                source: 'The pitcher allowed three runs in just two innings.',
                                target: '',
                            },
                        ],
                    },
                    {
                        cefr: '[ C ] (UK also ladder)',
                        definition: {
                            source: 'a long, vertical hole in tights and stockings',
                            target: '（连裤袜或长筒袜上的）脱线，抽丝',
                        },
                        examples: [
                            {
                                source: "I've got a run in my tights from the nail on my chair.",
                                target: '我的连裤袜被椅子上的钉子刮了一下，抽丝了。',
                            },
                        ],
                    },
                    {
                        cefr: '',
                        definition: {
                            source: 'a condition of the bowels in which the contents are passed out of the body too often and in a form that is too liquid',
                            target: '拉肚子，腹泻，跑肚',
                        },
                        examples: [],
                    },
                ],
            },
        ],
    };
}
