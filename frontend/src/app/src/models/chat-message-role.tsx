export enum MessageRole {
  Assistant = 0,
  User = 1,
  System = 2,
}

export const MessageRoleString = {
  [MessageRole.Assistant]: "Assistant",
  [MessageRole.User]: "User",
  [MessageRole.System]: "System",
};
