// 领域事件总线（移植自 7e6d01f:src/shared/events.ts）。
// 先记录后通知：log 是战斗的完整事件流，供 UI 渲染、回放与指纹比对。
// 泛型化，避免 shared 反向依赖 combat 的 DomainEvent。

export type EventListener<E> = (event: E) => void

export class EventBus<E> {
  private events: E[] = []
  private readonly listeners = new Set<EventListener<E>>()

  emit(event: E): void {
    this.events.push(event)
    for (const l of this.listeners) l(event)
  }

  get log(): readonly E[] {
    return this.events
  }

  clearLog(): void {
    this.events = []
  }

  subscribe(listener: EventListener<E>): () => void {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }
}
