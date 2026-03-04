export interface EventDispatcher {
    /**
     * Dispatch an event with an optional payload
     */
    dispatch(event: string, payload?: any): void;
}
