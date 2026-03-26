import React from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import './ConfirmGenerateModal.css';
import { useTranslation } from 'react-i18next';

interface ConfirmGenerateModalProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
}

export const ConfirmGenerateModal: React.FC<ConfirmGenerateModalProps> = ({ open, onClose, onConfirm }) => {
    const { t } = useTranslation();
    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby='modal-modal-title'
            aria-describedby='modal-modal-description'
        >
            <Box className='modal-confirm-generate-jobpost'>
                <Typography
                    id='modal-modal-title'
                    variant='h6'
                    component='h2'
                    className='modal-confirm-jobpost__title'
                >
                    {t('components:confirmGenerateModal.title')}
                </Typography>
                <div className='modal-confirm-jobpost__bot-wrapper'>
                    <Typography variant='body1' component='p'>
                        {t('components:confirmGenerateModal.description')}
                    </Typography>
                </div>
                <div className='modal-confirm-jobpost__buttons-wrapper'>
                    <Button
                        variant='outlined'
                        size='large'
                        onClick={onClose}
                    >
                        {t('components:confirmGenerateModal.buttons.cancel')}
                    </Button>
                    <Button variant='contained' size='large' onClick={onConfirm}>
                        {t('components:confirmGenerateModal.buttons.confirm')}
                    </Button>
                </div>
            </Box>
        </Modal >
    )
};
