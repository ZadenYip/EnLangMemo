import { CommonModule } from "@angular/common";
import { Component, OnInit, inject } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { Router } from "@angular/router";
import { TranslateModule } from "@ngx-translate/core";
import Logger from "electron-log";

/**
 * 牌组首页条目视图模型。
 */
interface DeckOverviewItem {
    /** 牌组唯一标识，用于前端追踪与后续跳转。 */
    id: string;
    /** 牌组展示名称。 */
    name: string;
    /** 今日已复习卡片数量。 */
    reviewedToday: number;
    /** 今日应复习卡片数量。 */
    dueToday: number;
    /** 今日还可学习的新卡数量。 */
    canLearnToday: number;
}

@Component({
    selector: "app-home",
    templateUrl: "./home.component.html",
    styleUrls: ["./home.component.scss"],
    standalone: true,
    imports: [CommonModule, TranslateModule, MatButtonModule, MatCardModule, MatIconModule],
})
export class HomeComponent implements OnInit {
    /** 路由服务，用于后续页面跳转。 */
    private readonly router: Router = inject(Router);

    /** 首页展示的牌组列表；后续可替换为真实服务返回。 */
    readonly deckOverviewList: DeckOverviewItem[] = [
        { id: "default", name: "Default", reviewedToday: 12, dueToday: 35, canLearnToday: 18 },
        { id: "ielts", name: "IELTS", reviewedToday: 7, dueToday: 22, canLearnToday: 25 },
        { id: "movie", name: "Movie Phrases", reviewedToday: 4, dueToday: 11, canLearnToday: 30 },
    ];

    /** 创建牌组输入框的临时名称值。 */
    pendingDeckName = "";

    /** 组件初始化钩子，用于记录首页加载。 */
    ngOnInit(): void {
        Logger.info("Home deck material view initialized");
    }

    /**
     * 点击牌组名按钮后进入该牌组复习页。
     * 当前先保留占位逻辑，待复习页路由完成后接入。
     */
    openDeckReview(deck: DeckOverviewItem): void {
        Logger.info("TODO: open deck review page", {
            deck,
            currentUrl: this.router.url,
        });
    }

    /**
     * 点击设置按钮后进入牌组设置页。
     * 当前先保留占位逻辑，待牌组设置页完成后接入。
     */
    openDeckSettings(deck: DeckOverviewItem): void {
        Logger.info("TODO: open deck settings page", {
            deck,
            currentUrl: this.router.url,
        });
    }

    /**
     * 点击创建占位块后触发创建牌组流程。
     * 当前先保留占位逻辑，待创建流程确认后接入。
     */
    createDeck(): void {
        Logger.info("TODO: create deck", {
            currentUrl: this.router.url,
        });
    }

    /** 监听创建输入框变化并同步到组件状态。 */
    onPendingDeckNameInput(event: Event): void {
        const target = event.target;
        if (!(target instanceof HTMLInputElement)) {
            return;
        }
        this.pendingDeckName = target.value;
    }

    /** 点击确认按钮时读取当前输入值，后续可在此接入真实创建逻辑。 */
    confirmCreateDeck(): void {
        const deckName = this.pendingDeckName.trim();
        Logger.info("TODO: confirm create deck", {
            deckName,
            currentUrl: this.router.url,
        });
    }

    /** 点击取消按钮时清空输入框。 */
    cancelCreateDeck(): void {
        this.pendingDeckName = "";
    }
}
