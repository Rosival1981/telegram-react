/*
 *  Copyright (c) 2018-present, Evgeny Nadymov
 *
 * This source code is licensed under the GPL v.3.0 license found in the
 * LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import classNames from 'classnames';
import { compose } from 'recompose';
import { withTranslation } from 'react-i18next';
import { withStyles } from '@material-ui/core';
import PlayArrowIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import RepeatIcon from '@material-ui/icons/Repeat';
import RepeatOneIcon from '@material-ui/icons/RepeatOne';
import ShuffleIcon from '@material-ui/icons/Shuffle';
import SkipNextIcon from '@material-ui/icons/SkipNext';
import SkipPreviousIcon from '@material-ui/icons/SkipPrevious';
import CloseIcon from '@material-ui/icons/Close';
import IconButton from '@material-ui/core/IconButton';
import VolumeButton from '../Player/VolumeButton';
import { borderStyle } from '../Theme';
import { getSrc } from '../../Utils/File';
import { getDurationString } from '../../Utils/Common';
import { getDate, getDateHint, getMediaTitle, hasAudio } from '../../Utils/Message';
import {
    PLAYER_PLAYBACKRATE_FAST,
    PLAYER_PLAYBACKRATE_NORMAL,
    PLAYER_STARTTIME,
    PLAYER_VOLUME_NORMAL
} from '../../Constants';
import PlayerStore from '../../Stores/PlayerStore';
import FileStore from '../../Stores/FileStore';
import ApplicationStore from '../../Stores/ApplicationStore';
import TdLibController from '../../Controllers/TdLibController';
import './HeaderPlayer.css';

const styles = theme => ({
    iconButton: {
        padding: 4
    },
    ...borderStyle(theme)
});

class HeaderPlayer extends React.Component {
    constructor(props) {
        super(props);

        this.videoRef = React.createRef();

        const { playbackRate, volume, message } = PlayerStore;

        this.startTime = PLAYER_STARTTIME;

        this.state = {
            playbackRate: playbackRate,
            currentTime: 0,
            currentTimeString: getDurationString(0),
            volume: volume,
            message: message,
            playing: false,
            src: this.getMediaSrc(message)
        };
    }

    shouldComponentUpdate(nextProps, nextState, nextContext) {
        const { theme } = this.props;
        const { message, src, playing, currentTimeString, playbackRate } = this.state;

        if (nextProps.theme !== theme) {
            return true;
        }

        if (nextState.playbackRate !== playbackRate) {
            return true;
        }

        if (nextState.message !== message) {
            return true;
        }

        if (nextState.src !== src) {
            return true;
        }

        if (nextState.playing !== playing) {
            return true;
        }

        if (nextState.currentTimeString !== currentTimeString) {
            return true;
        }

        return false;
    }

    componentDidMount() {
        FileStore.on('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        FileStore.on('clientUpdateAudioBlob', this.onClientUpdateVideoNoteBlob);
        PlayerStore.on('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.on('clientUpdateMediaViewerPlay', this.onClientUpdateMediaViewerPlay);
        PlayerStore.on('clientUpdateMediaViewerPause', this.onClientUpdateMediaViewerPause);
        PlayerStore.on('clientUpdateMediaViewerEnded', this.onClientUpdateMediaViewerEnded);
        PlayerStore.on('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);

        ApplicationStore.on('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    componentWillUnmount() {
        FileStore.removeListener('clientUpdateVideoNoteBlob', this.onClientUpdateVideoNoteBlob);
        FileStore.removeListener('clientUpdateAudioBlob', this.onClientUpdateVideoNoteBlob);
        PlayerStore.removeListener('clientUpdateMediaActive', this.onClientUpdateMediaActive);
        PlayerStore.removeListener('clientUpdateMediaViewerPlay', this.onClientUpdateMediaViewerPlay);
        PlayerStore.removeListener('clientUpdateMediaViewerPause', this.onClientUpdateMediaViewerPause);
        PlayerStore.removeListener('clientUpdateMediaViewerEnded', this.onClientUpdateMediaViewerEnded);
        PlayerStore.removeListener('clientUpdateMediaVolume', this.onClientUpdateMediaVolume);

        ApplicationStore.removeListener('clientUpdateMediaViewerContent', this.onClientUpdateMediaViewerContent);
    }

    onClientUpdateMediaVolume = update => {
        const { volume } = update;

        const player = this.videoRef.current;
        if (!player) return;

        player.volume = volume;

        this.setState({ volume });
    };

    onClientUpdateMediaViewerContent = update => {
        this.playingMediaViewer = Boolean(ApplicationStore.mediaViewerContent);
    };

    onClientUpdateMediaViewerEnded = update => {
        this.playingMediaViewer = false;
    };

    onClientUpdateMediaViewerPause = update => {
        this.playingMediaViewer = false;
    };

    onClientUpdateMediaViewerPlay = update => {
        this.playingMediaViewer = true;

        const player = this.videoRef.current;
        if (!player) return;

        player.pause();
    };

    onClientUpdateVideoNoteBlob = update => {
        const { chatId, messageId } = update;
        const { message, playbackRate } = this.state;

        if (!message) return;

        const { chat_id, id, content } = message;
        if (!content) return;
        if (chatId !== chat_id || messageId !== id) return;

        switch (content['@type']) {
            case 'messageText': {
                const { web_page } = content;
                if (web_page) {
                    const { audio, video_note } = web_page;

                    if (audio) {
                        const file = audio.audio;
                        if (file) {
                            this.setState(
                                {
                                    src: this.getMediaSrc(message)
                                },
                                () => {
                                    const player = this.videoRef.current;
                                    if (player) {
                                        //player.currentTime = this.startTime;
                                        if (this.playingMediaViewer) {
                                            player.pause();
                                        }
                                    }
                                }
                            );
                        }
                    }

                    if (video_note) {
                        const { video } = video_note;
                        if (video) {
                            this.setState(
                                {
                                    src: this.getMediaSrc(message)
                                },
                                () => {
                                    const player = this.videoRef.current;
                                    if (player) {
                                        //player.currentTime = this.startTime;
                                        if (this.playingMediaViewer) {
                                            player.pause();
                                        }
                                    }
                                }
                            );
                        }
                    }
                }

                break;
            }
            case 'messageAudio': {
                const { audio } = content;
                if (audio) {
                    const file = audio.audio;
                    if (file) {
                        this.setState(
                            {
                                src: this.getMediaSrc(message)
                            },
                            () => {
                                const player = this.videoRef.current;
                                if (player) {
                                    //player.currentTime = this.startTime;
                                    if (this.playingMediaViewer) {
                                        player.pause();
                                    }
                                }
                            }
                        );
                    }
                }

                break;
            }
            case 'messageVideoNote': {
                const { video_note } = content;
                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        this.setState(
                            {
                                src: this.getMediaSrc(message)
                            },
                            () => {
                                const player = this.videoRef.current;
                                if (player) {
                                    //player.currentTime = this.startTime;
                                    if (this.playingMediaViewer) {
                                        player.pause();
                                    }
                                }
                            }
                        );
                    }
                }

                break;
            }
        }
    };

    onClientUpdateMediaActive = update => {
        const { chatId, messageId } = update;
        const { message, src } = this.state;

        if (message && message.chat_id === chatId && message.id === messageId) {
            if (src) {
                const player = this.videoRef.current;
                if (player) {
                    if (player.paused) {
                        player.play();
                    } else {
                        player.pause();
                    }
                }
            }
        } else {
            const src = this.getMediaSrc(PlayerStore.message);
            const playing = Boolean(src);
            this.setState(
                {
                    message: PlayerStore.message,
                    playing: playing,
                    src: src
                },
                () => {
                    const player = this.videoRef.current;
                    if (player) {
                        player.currentTime = this.startTime;
                        if (this.playingMediaViewer) {
                            player.pause();

                            //this.handleVideoPause();
                        }
                    }
                }
            );
        }
    };

    handlePrev = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPrev'
        });
    };

    handlePlay = () => {
        const { message } = this.state;
        if (!message) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaActive',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handleNext = () => {
        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaNext'
        });
    };

    getMediaSrc = message => {
        if (message) {
            const { content } = message;
            if (content) {
                const { audio, video_note, web_page } = content;
                if (audio) {
                    const file = audio.audio;
                    if (file) {
                        return getSrc(file);
                    }
                }
                if (video_note) {
                    const { video } = video_note;
                    if (video) {
                        return getSrc(video);
                    }
                }
                if (web_page) {
                    if (web_page.audio) {
                        const file = web_page.audio.audio;
                        if (file) {
                            return getSrc(file);
                        }
                    }
                    if (web_page.video_note) {
                        const { video } = web_page.video_note;
                        if (video) {
                            return getSrc(video);
                        }
                    }
                }
            }
        }

        return '';
    };

    handleEnded = () => {
        const { message } = this.state;
        if (!message) return;

        this.setState({
            playing: false,
            message: null,
            src: null
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaEnd',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handleClose = () => {
        const player = this.videoRef.current;
        if (player) {
            player.pause();
        }

        this.handleEnded();
    };

    handleTimeUpdate = () => {
        const { message } = this.state;
        if (!message) return;

        const player = this.videoRef.current;
        if (!player) return;

        this.setState({
            currentTime: player.currentTime,
            currentTimeString: getDurationString(Math.floor(player.currentTime || 0))
        });

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaTime',
            chatId: message.chat_id,
            messageId: message.id,
            duration: player.duration,
            currentTime: player.currentTime,
            timestamp: Date.now()
        });
    };

    handleCanPlay = () => {
        const { message, playbackRate, volume } = this.state;
        if (!message) return;

        const player = this.videoRef.current;
        if (!player) return;

        player.playbackRate = hasAudio(message) ? PLAYER_PLAYBACKRATE_NORMAL : playbackRate;
        player.volume = volume;
        player.muted = false;

        //return;

        let stream = null;
        if ('captureStream' in player) {
            stream = player.captureStream();
        } else if ('mozCaptureStream' in player) {
            stream = player.mozCaptureStream();
        }

        if (!stream) {
            return;
        }

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaCaptureStream',
            chatId: message.chat_id,
            messageId: message.id,
            stream: stream
        });
    };

    handleVideoPlay = () => {
        const { message } = this.state;
        if (!message) return;

        this.setState({
            playing: true
        });

        const player = this.videoRef.current;
        if (!player) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlay',
            chatId: message.chat_id,
            messageId: message.id,
            currentTime: player.currentTime,
            duration: player.duration,
            timestamp: Date.now()
        });
    };

    handleVideoPause = () => {
        const { message } = this.state;
        if (!message) return;

        this.setState({
            playing: false
        });

        const player = this.videoRef.current;
        if (!player) return;

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPause',
            chatId: message.chat_id,
            messageId: message.id
        });
    };

    handlePlaybackRate = () => {
        const { playbackRate } = this.state;

        const nextPlaybackRate =
            playbackRate === PLAYER_PLAYBACKRATE_NORMAL ? PLAYER_PLAYBACKRATE_FAST : PLAYER_PLAYBACKRATE_NORMAL;

        this.setState(
            {
                playbackRate: nextPlaybackRate
            },
            () => {
                const player = this.videoRef.current;
                if (!player) return;

                player.playbackRate = nextPlaybackRate;
            }
        );

        TdLibController.clientUpdate({
            '@type': 'clientUpdateMediaPlaybackRate',
            playbackRate: nextPlaybackRate
        });
    };

    render() {
        const { classes } = this.props;
        const { playing, message, src, currentTimeString, playbackRate } = this.state;

        const title = getMediaTitle(message);
        const dateHint = getDateHint(message);
        const date = getDate(message);
        const showDate = !hasAudio(message);
        const showPlaybackRate = !hasAudio(message);

        return (
            <>
                <video
                    className='header-player-video'
                    ref={this.videoRef}
                    src={src}
                    autoPlay={true}
                    controls={false}
                    width={44}
                    height={44}
                    onCanPlay={this.handleCanPlay}
                    onPlay={this.handleVideoPlay}
                    onPause={this.handleVideoPause}
                    onTimeUpdate={this.handleTimeUpdate}
                    onEnded={this.handleEnded}
                />
                {message && (
                    <div className={classNames(classes.borderColor, 'header-player')}>
                        <IconButton className={classes.iconButton} color='primary' disabled>
                            <SkipPreviousIcon />
                        </IconButton>
                        <IconButton
                            className={classes.iconButton}
                            color='primary'
                            disabled={!src}
                            onClick={this.handlePlay}>
                            {playing ? <PauseIcon fontSize='small' /> : <PlayArrowIcon fontSize='small' />}
                        </IconButton>
                        <IconButton className={classes.iconButton} color='primary' disabled>
                            <SkipNextIcon />
                        </IconButton>
                        <div className='header-player-content'>
                            <div className='header-player-title'>
                                <span title={title}>{title}</span>
                                {showDate && (
                                    <span title={dateHint} style={{ paddingLeft: 8 }}>
                                        {date}
                                    </span>
                                )}
                            </div>
                            <div className='header-player-meta'>{currentTimeString}</div>
                        </div>
                        <VolumeButton />
                        {showPlaybackRate && (
                            <IconButton
                                className={classes.iconButton}
                                color={playbackRate > PLAYER_PLAYBACKRATE_NORMAL ? 'primary' : 'default'}
                                onClick={this.handlePlaybackRate}>
                                <div className='header-player-playback-icon'>2X</div>
                            </IconButton>
                        )}
                        <IconButton className={classes.iconButton} onClick={this.handleClose}>
                            <CloseIcon fontSize='small' />
                        </IconButton>
                    </div>
                )}
            </>
        );
    }
}

const enhance = compose(
    withTranslation(),
    withStyles(styles, { withTheme: true })
);

export default enhance(HeaderPlayer);