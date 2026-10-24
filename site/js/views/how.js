// 「怎么打」：一页讲清战斗模型。只写玩家需要知道的规则，不讲实现与设计过程。
export function renderHow(view) {
  view.innerHTML = `
  <h1 class="page-title">一局怎么打</h1>
  <p class="page-lead">没有手牌，也没有抽牌。你战前配好队伍与技能，战中只做一件事：在正确的时机，把技能打在对的人身上。</p>

  <div class="how-grid">
    <section class="how-step">
      <span class="how-num">01</span>
      <h2>行动条决定谁先动</h2>
      <p>每个单位按敏捷积累行动条，条满获得一次行动机会。能量按 tick 回复，技能各有冷却；部分仪式技能还要先吟唱若干 tick。</p>
      <p class="muted">跳过或没有可用的技能也算一次机会——节奏本身就是资源。</p>
    </section>

    <section class="how-step">
      <span class="how-num">02</span>
      <h2>战前配好 4 主动 + 4 被动</h2>
      <p>每名英雄带 4 个主动技能与 4 个被动。主动消耗能量、占用机会；被动由触发点驱动（开局、受击、击杀、回合开始/结束等），不主动出手。</p>
      <p class="muted">同一条途径的卡共享「产层 → 读层」的循环：一张卡存资源，另一张卡兑现。</p>
    </section>

    <section class="how-step">
      <span class="how-num">03</span>
      <h2>站位与攻击性质</h2>
      <p>战场是 2 路 × 4 格，靠中线的一格是前线。近战要贴脸、投掷可被拦截、法术不可拦截但仍会被反击；站位直接决定谁能打到谁、谁替谁承伤。</p>
      <p class="muted">位移、嘲讽、守护、隐匿都在这一层博弈。</p>
    </section>

    <section class="how-step">
      <span class="how-num">04</span>
      <h2>一次行动的结算</h2>
      <p>选技能 → 选目标（手动或自动）→ 结算。伤害依次经过：护盾 → 护甲 → 属性抗性 → 防御 → 乘区 → 下限；DoT 只过属性抗性。</p>
      <p class="muted">治疗、护盾、驱散、召唤与规则改写走同一套行动机会。</p>
    </section>

    <section class="how-step">
      <span class="how-num">05</span>
      <h2>状态是主战场</h2>
      <p>状态分增益、减益、控制、光环、姿态等类别，带层数、时长与次数。层数可以叠、可以被消费、可以触发阈值；控制与免疫则直接改变「这回合能不能动」。</p>
      <p class="muted">看到「产层 / 读层 / 清除」三个词，指的就是这条循环。</p>
    </section>

    <section class="how-step">
      <span class="how-num">06</span>
      <h2>八种元素与相消</h2>
      <p>火、冰、毒、雷、精神、物理、圣、暗。水与污秽等风味走状态标签，不占元素位。火克冰、圣克暗：对立元素命中时会削掉 1 层并让本次伤害 ×0.85。</p>
      <p class="muted">同元素命中还会触发共鸣：灼烧叠层、中毒/冻伤续时，满层后升阶。</p>
    </section>
  </div>

  <div class="panel how-next">
    <h2>接下来</h2>
    <p><a href="#/pathways">22 条途径</a> —— 每条途径的玩法命题与代表卡。</p>
    <p><a href="#/mechanics">机制图鉴</a> —— 状态类别、触发时机与元素一览。</p>
    <p><a href="#/cards">卡池</a> —— 按途径、构筑轴、稀有度筛选全部技能卡。</p>
    <p><a class="home-btn home-btn--primary" href="../">直接开玩 →</a></p>
  </div>`;
}
