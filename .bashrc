#
# ~/.bashrc
#

# If not running interactively, don't do anything
[[ $- != *i* ]] && return

alias ls='ls --color=auto'
alias grep='grep --color=auto'
PS1='[\u@\h \W]\$ '


########################
#      User Made       #
########################

## Start my github credentials
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/XXXXXXXXXXXXX

## Aliases
alias ls='ls --color=auto'
alias grep='grep --color=auto'
alias ll="ls -l -a"
alias cd..="cd .."
alias lg="lazygit"
alias qq="exit"
alias q="exit"

## Startups
eval "$(starship init bash)"
eval "$(/home/mizuki/miniconda3/bin/conda shell.bash hook)"

## Exports
export TERMINAL="gnome-terminal"
export GTK_IM_MODULE='ibus'
export QT_IM_MODULE='ibus'
export XMODIFIERS=@im='ibus'

clear
