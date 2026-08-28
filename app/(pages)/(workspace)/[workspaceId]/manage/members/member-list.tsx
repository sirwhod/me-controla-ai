"use client"

import * as React from "react"
import { WorkspaceMemberInfo, WorkspacePendingInvite } from "@/app/http/members"
import { Avatar, AvatarFallback, AvatarImage } from "@/app/components/ui/avatar"
import { Badge } from "@/app/components/ui/badge"
import { Button } from "@/app/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu"
import { Clock, Crown, Mail, MoreHorizontal, Trash2, UserMinus } from "lucide-react"

interface MemberListProps {
  children: React.ReactNode
  className?: string
}

export function MemberList({ children, className }: MemberListProps) {
  return (
    <div className={`flex flex-col space-y-2.5 w-full ${className || ""}`}>
      {children}
    </div>
  )
}

interface MemberListItemProps {
  member: WorkspaceMemberInfo
  isOwner: boolean
  onRemove: (member: WorkspaceMemberInfo) => void
}

export function MemberListItem({ member, isOwner, onRemove }: MemberListItemProps) {
  const isSelfOrOwnerRole = member.role === "owner"
  const canRemove = isOwner && !isSelfOrOwnerRole

  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      {/* Identidade + Papel + E-mail */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <Avatar className="h-10 w-10 shrink-0 border border-border/50 shadow-2xs">
          {member.image && <AvatarImage src={member.image} alt={member.name} />}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
            {member.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-sm sm:text-base text-foreground truncate">
              {member.name}
            </span>
            {member.role === "owner" ? (
              <Badge
                variant="secondary"
                className="gap-1 text-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 shrink-0 font-medium"
              >
                <Crown className="h-3 w-3" />
                Proprietário
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-muted/30 shrink-0">
                Membro
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground truncate mt-0.5">
            {member.email}
          </span>
        </div>
      </div>

      {/* Ações (Disponíveis apenas para o Proprietário sobre Membros) */}
      {canRemove && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Ações de ${member.name}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Opções</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(member.email)}
              className="text-xs cursor-pointer"
            >
              Copiar e-mail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onRemove(member)}
              className="text-xs cursor-pointer text-destructive focus:text-destructive gap-2 font-medium"
            >
              <UserMinus className="h-4 w-4" />
              Remover acesso
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}

interface PendingInviteItemProps {
  invite: WorkspacePendingInvite
  isOwner: boolean
  onCancel: (invite: WorkspacePendingInvite) => void
}

export function PendingInviteItem({ invite, isOwner, onCancel }: PendingInviteItemProps) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-xl border border-border/60 bg-card/60 hover:bg-card/90 transition-all shadow-xs gap-3">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="h-10 w-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 border border-amber-500/20">
          <Mail className="h-5 w-5" />
        </div>

        <div className="flex flex-col min-w-0 flex-1">
          <span className="font-medium text-xs sm:text-sm text-foreground truncate">
            {invite.inviteeEmail}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <Clock className="h-3 w-3 text-amber-500 shrink-0" />
            <span className="text-[11px] text-amber-500 font-medium">
              Aguardando aceite
            </span>
          </div>
        </div>
      </div>

      {isOwner && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 -mr-1.5 p-0 text-muted-foreground hover:text-foreground shrink-0 rounded-lg hover:bg-accent/80"
              aria-label={`Opções do convite ${invite.inviteeEmail}`}
            >
              <MoreHorizontal className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="text-xs">Opções</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(invite.inviteeEmail)}
              className="text-xs cursor-pointer"
            >
              Copiar e-mail
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onCancel(invite)}
              className="text-xs cursor-pointer text-destructive focus:text-destructive gap-2 font-medium"
            >
              <Trash2 className="h-4 w-4" />
              Cancelar convite
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  )
}
